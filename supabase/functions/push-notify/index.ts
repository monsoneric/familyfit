// Supabase Edge Function: push-notify
// Called server-side after activity insert via Supabase Database Webhook
// (configure in Supabase Dashboard: Database > Webhooks > activities INSERT)
//
// Deploy: supabase functions deploy push-notify
// Secrets needed:
//   supabase secrets set VAPID_PUBLIC_KEY=...
//   supabase secrets set VAPID_PRIVATE_KEY=...
//   supabase secrets set VAPID_SUBJECT=mailto:you@example.com
//
// Generate VAPID keys: npx web-push generate-vapid-keys

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:familyfit@example.com'

const db = createClient(SUPABASE_URL, SERVICE_KEY)

// Minimal VAPID JWT builder (no npm needed in Deno)
async function buildVapidAuth(endpoint: string) {
  const audience = new URL(endpoint).origin
  const header   = btoa(JSON.stringify({ alg: 'ES256', typ: 'JWT' }))
  const payload  = btoa(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  }))
  const unsigned = `${header}.${payload}`

  // Import private key
  const keyData  = Uint8Array.from(atob(VAPID_PRIVATE.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0))
  const key      = await crypto.subtle.importKey(
    'pkcs8', keyData.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const sig  = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  )
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')

  return {
    Authorization: `vapid t=${unsigned}.${sigB64},k=${VAPID_PUBLIC}`,
  }
}

Deno.serve(async (req: Request) => {
  const body = await req.json()

  // Supabase DB webhook sends { type, table, record, ... }
  const activity = body.record
  if (!activity) return Response.json({ ok: true })

  // Get actor name
  const { data: member } = await db
    .from('members').select('name').eq('id', activity.member_id).single()
  const actorName = member?.name ?? 'Someone'

  // Build notification text
  const parts: string[] = []
  if (activity.steps)    parts.push(`${Number(activity.steps).toLocaleString()} steps`)
  if (activity.distance) parts.push(`${Number(activity.distance).toFixed(1)} mi`)
  if (activity.duration) parts.push(`${Math.round(activity.duration)} min`)
  const detail  = parts.join(' · ') || activity.type
  const title   = `${actorName} just logged a workout! 💪`
  const message = `${activity.note || activity.type} — ${detail}`

  // Get all push subscriptions EXCEPT the actor's
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('*')
    .neq('member_id', activity.member_id)
  if (!subs?.length) return Response.json({ ok: true, sent: 0 })

  const payload = JSON.stringify({ title, body: message, icon: '/icon-192.png', badge: '/icon-72.png' })

  let sent = 0
  await Promise.all(subs.map(async sub => {
    try {
      const auth = await buildVapidAuth(sub.endpoint)
      const res  = await fetch(sub.endpoint, {
        method:  'POST',
        headers: {
          ...auth,
          'Content-Type':     'application/json',
          'Content-Encoding': 'aes128gcm',
          TTL:                '86400',
        },
        body: payload,
      })
      if (res.status === 410 || res.status === 404) {
        // Subscription expired — remove it
        await db.from('push_subscriptions').delete().eq('id', sub.id)
      } else {
        sent++
      }
    } catch (e) {
      console.error('Push send error:', e)
    }
  }))

  return Response.json({ ok: true, sent })
})
