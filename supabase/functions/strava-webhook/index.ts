// Supabase Edge Function: strava-webhook
// Handles:
//   GET  ?hub.challenge=...  → Strava webhook verification
//   POST {object_type, object_id, ...} → new activity webhook
//   GET  ?code=...&member_id=... → OAuth callback after Strava authorization
//
// Deploy: supabase functions deploy strava-webhook
// Set secrets:
//   supabase secrets set STRAVA_CLIENT_ID=...
//   supabase secrets set STRAVA_CLIENT_SECRET=...
//   supabase secrets set STRAVA_VERIFY_TOKEN=familyfit2025
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRAVA_CLIENT_ID     = Deno.env.get('STRAVA_CLIENT_ID')!
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')!
const STRAVA_VERIFY_TOKEN  = Deno.env.get('STRAVA_VERIFY_TOKEN') ?? 'familyfit2025'
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY          = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const db = createClient(SUPABASE_URL, SERVICE_KEY)

// Map Strava activity types → FamilyFit types
const TYPE_MAP: Record<string, string> = {
  Run: 'Running', Walk: 'Walking', Hike: 'Hiking', Ride: 'Cycling',
  Swim: 'Swimming', Rowing: 'Rowing', Yoga: 'Yoga', WeightTraining: 'Strength training',
  Elliptical: 'Elliptical', StairStepper: 'Stair climbing', Golf: 'Golf',
  Skiing: 'Skiing', IceSkate: 'Skating', Soccer: 'Soccer', Basketball: 'Basketball',
  Tennis: 'Tennis', Pilates: 'Pilates', Crossfit: 'CrossFit',
}

Deno.serve(async (req: Request) => {
  const url    = new URL(req.url)
  const method = req.method

  // ── Strava webhook verification (GET with hub params) ──
  if (method === 'GET' && url.searchParams.has('hub.challenge')) {
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (token !== STRAVA_VERIFY_TOKEN) {
      return new Response('Forbidden', { status: 403 })
    }
    return Response.json({ 'hub.challenge': challenge })
  }

  // ── OAuth callback: ?code=...&member_id=... ──
  if (method === 'GET' && url.searchParams.has('code')) {
    const code     = url.searchParams.get('code')!
    const memberId = url.searchParams.get('member_id')!

    // Exchange code for tokens
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
      }),
    })
    const token = await tokenRes.json()
    if (!token.access_token) {
      return new Response('Token exchange failed', { status: 400 })
    }

    await db.from('strava_connections').upsert({
      member_id:          memberId,
      strava_athlete_id:  token.athlete.id,
      access_token:       token.access_token,
      refresh_token:      token.refresh_token,
      expires_at:         token.expires_at,
    })

    // Redirect back to app
    return Response.redirect(`${url.origin.replace('/functions/v1/strava-webhook', '')}?strava=connected`)
  }

  // ── Strava activity webhook (POST) ──
  if (method === 'POST') {
    const body = await req.json()

    // Only handle new activities
    if (body.object_type !== 'activity' || body.aspect_type !== 'create') {
      return Response.json({ ok: true })
    }

    const athleteId  = body.owner_id
    const stravaActId = body.object_id

    // Check for duplicate
    const { data: existing } = await db.from('strava_imports')
      .select('strava_activity_id').eq('strava_activity_id', stravaActId).maybeSingle()
    if (existing) return Response.json({ ok: true, duplicate: true })

    // Find member by strava athlete id
    const { data: conn } = await db.from('strava_connections')
      .select('member_id, access_token, refresh_token, expires_at')
      .eq('strava_athlete_id', athleteId)
      .maybeSingle()
    if (!conn) return Response.json({ ok: true, msg: 'no member mapped' })

    // Refresh token if expired
    let accessToken = conn.access_token
    if (Date.now() / 1000 > conn.expires_at - 300) {
      const r = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:     STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          grant_type:    'refresh_token',
          refresh_token: conn.refresh_token,
        }),
      })
      const fresh = await r.json()
      accessToken = fresh.access_token
      await db.from('strava_connections').update({
        access_token:  fresh.access_token,
        refresh_token: fresh.refresh_token,
        expires_at:    fresh.expires_at,
      }).eq('member_id', conn.member_id)
    }

    // Fetch activity details from Strava
    const actRes = await fetch(`https://www.strava.com/api/v3/activities/${stravaActId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const act = await actRes.json()

    // Find an active challenge this member participates in
    const { data: chMember } = await db
      .from('challenge_members')
      .select('challenge_id, challenges(metric, ends_at, archived)')
      .eq('member_id', conn.member_id)
      .filter('challenges.archived', 'eq', false)
      .filter('challenges.ends_at', 'gte', new Date().toISOString())
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!chMember) return Response.json({ ok: true, msg: 'no active challenge' })

    const distanceMiles = act.distance ? act.distance / 1609.34 : null
    const steps         = act.moving_time ? Math.round(act.moving_time / 60 * 100) : null  // rough est.
    const actType       = TYPE_MAP[act.type] ?? act.type ?? 'Other'

    const { data: newAct } = await db.from('activities').insert({
      member_id:    conn.member_id,
      challenge_id: chMember.challenge_id,
      type:         actType,
      steps:        steps,
      distance:     distanceMiles ? Math.round(distanceMiles * 10) / 10 : null,
      duration:     act.moving_time ? Math.round(act.moving_time / 60) : null,
      note:         `${act.name} (via Strava)`,
    }).select().single()

    // Record import
    await db.from('strava_imports').insert({
      strava_activity_id: stravaActId,
      activity_id:        newAct.id,
    })

    return Response.json({ ok: true, activity_id: newAct.id })
  }

  return new Response('Method not allowed', { status: 405 })
})
