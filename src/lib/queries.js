import { supabase } from './supabase'

export async function getSetting(key) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

export async function getMembers() {
  const { data, error } = await supabase.from('members').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function addMember({ name, initials, color }) {
  const { data, error } = await supabase.from('members').insert({ name, initials, color }).select().single()
  if (error) throw error
  return data
}

export async function getChallenges({ includeArchived = false } = {}) {
  let q = supabase
    .from('challenges')
    .select('*, challenge_members(member_id)')
    .order('starts_at', { ascending: false })
  if (!includeArchived) q = q.eq('archived', false)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getRoutineSteps(routineName) {
  const { data, error } = await supabase
    .from('routine_steps')
    .select('*')
    .eq('routine_name', routineName)
    .order('step_order', { ascending: true })

  if (error) throw error
  return data
}

// All routine metadata (name, description, estimated minutes, category)
export async function getRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

// Single routine's metadata by name
export async function getRoutine(routineName) {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('name', routineName)
    .maybeSingle()
  if (error) throw error
  return data
}

// Weekly schedule — returns all 7 days with their assigned routine (or null for rest days)
export async function getWeeklySchedule() {
  const { data, error } = await supabase
    .from('routine_schedule')
    .select('*, routines(name, description, estimated_minutes, category)')
    .order('day_of_week', { ascending: true })
  if (error) throw error
  return data
}

// Today's scheduled routine, based on the local day of week
export async function getTodaysRoutine() {
  const dayOfWeek = new Date().getDay()
  const { data, error } = await supabase
    .from('routine_schedule')
    .select('*, routines(name, description, estimated_minutes, category)')
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createChallenge({ name, metric, goal, type, starts_at, ends_at, member_ids, created_by }) {
  const { data: ch, error: ce } = await supabase
    .from('challenges')
    .insert({ name, metric, goal: goal || null, type, starts_at, ends_at, created_by })
    .select()
    .single()
  if (ce) throw ce
  if (member_ids?.length) {
    const rows = member_ids.map(id => ({ challenge_id: ch.id, member_id: id }))
    const { error: me } = await supabase.from('challenge_members').insert(rows)
    if (me) throw me
  }
  return ch
}

export async function getLeaderboard(challengeId) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('total', { ascending: false })
  if (error) throw error
  return data
}

export async function getActivities(challengeId, limit = 30) {
  const { data, error } = await supabase
    .from('activities')
    .select('*, members(name, initials, color)')
    .eq('challenge_id', challengeId)
    .order('logged_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getAllRecentActivities(limit = 50) {
  const { data, error } = await supabase
    .from('activities')
    .select('*, members(name, initials, color), challenges(name, metric)')
    .order('logged_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function logActivity({ member_id, challenge_id, type, steps, distance, duration, note }) {
  const { data, error } = await supabase
    .from('activities')
    .insert({ member_id, challenge_id, type, steps, distance, duration, note })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Phase 2 additions ─────────────────────────────────────

// Daily totals for bar chart
export async function getDailyTotals(challengeId) {
  const { data, error } = await supabase
    .from('daily_totals')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('day')
  if (error) throw error
  return data
}

// Cumulative totals for line chart
export async function getCumulativeTotals(challengeId) {
  const { data, error } = await supabase
    .from('cumulative_totals')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('day')
  if (error) throw error
  return data
}

// Reactions
export async function getReactions(activityIds) {
  if (!activityIds.length) return []
  const { data, error } = await supabase
    .from('reactions')
    .select('*, members(name, initials)')
    .in('activity_id', activityIds)
  if (error) throw error
  return data
}

export async function toggleReaction({ activity_id, member_id, emoji }) {
  // Try delete first; if nothing deleted, insert
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('activity_id', activity_id)
    .eq('member_id', member_id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
    return 'removed'
  } else {
    await supabase.from('reactions').insert({ activity_id, member_id, emoji })
    return 'added'
  }
}

// Edit / delete activity
export async function updateActivity(id, { type, steps, distance, duration, note }) {
  const { data, error } = await supabase
    .from('activities')
    .update({ type, steps: steps || null, distance: distance || null, duration: duration || null, note: note || null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteActivity(id) {
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw error
}

// Update challenge participants
export async function updateChallengeMembers(challengeId, memberIds) {
  await supabase.from('challenge_members').delete().eq('challenge_id', challengeId)
  if (memberIds.length) {
    const rows = memberIds.map(id => ({ challenge_id: challengeId, member_id: id }))
    const { error } = await supabase.from('challenge_members').insert(rows)
    if (error) throw error
  }
}

// Archive a challenge
export async function archiveChallenge(id) {
  const { error } = await supabase.from('challenges').update({ archived: true }).eq('id', id)
  if (error) throw error
}

// ── Phase 3 additions ─────────────────────────────────────

// Strava connection status for a member
export async function getStravaConnection(memberId) {
  const { data } = await supabase
    .from('strava_connections')
    .select('strava_athlete_id, connected_at')
    .eq('member_id', memberId)
    .maybeSingle()
  return data
}

export async function disconnectStrava(memberId) {
  await supabase.from('strava_connections').delete().eq('member_id', memberId)
}

// Push notification subscription management
export async function savePushSubscription({ member_id, endpoint, p256dh, auth }) {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ member_id, endpoint, p256dh, auth }, { onConflict: 'endpoint' })
  if (error) throw error
}

export async function removePushSubscription(endpoint) {
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

// Badges
export async function getBadges(memberId) {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('member_id', memberId)
    .order('earned_at', { ascending: false })
  if (error) throw error
  return data
}

export async function awardBadge({ member_id, type, label, emoji, challenge_id }) {
  const { error } = await supabase
    .from('badges')
    .upsert({ member_id, type, label, emoji, challenge_id }, { onConflict: 'member_id,type,challenge_id' })
  if (error) throw error
}

// Streaks
export async function getStreaks() {
  const { data, error } = await supabase
    .from('member_streaks')
    .select('*')
  if (error) throw error
  return data ?? []
}

// Check and award badges after each activity log
export async function checkAndAwardBadges({ member_id, challenge_id }) {
  // 1. First-ever activity badge
  const { count: total } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', member_id)
  if (total === 1) {
    await awardBadge({ member_id, type: 'first_activity', label: 'First step', emoji: '👟', challenge_id: null })
  }

  // 2. Activity milestones
  const milestones = [{ count: 10, type: 'activities_10', label: '10 activities', emoji: '🔟' },
                      { count: 25, type: 'activities_25', label: '25 activities', emoji: '💫' },
                      { count: 50, type: 'activities_50', label: '50 activities', emoji: '🌟' }]
  for (const m of milestones) {
    if (total === m.count) {
      await awardBadge({ member_id, type: m.type, label: m.label, emoji: m.emoji, challenge_id: null })
    }
  }

  // 3. Streak badges (7-day)
  const { data: streak } = await supabase
    .from('member_streaks')
    .select('current_streak')
    .eq('member_id', member_id)
    .maybeSingle()
  if (streak?.current_streak >= 7) {
    await awardBadge({ member_id, type: 'streak_7', label: '7-day streak', emoji: '🔥', challenge_id: null })
  }
  if (streak?.current_streak >= 30) {
    await awardBadge({ member_id, type: 'streak_30', label: '30-day streak', emoji: '🏅', challenge_id: null })
  }

  // 4. Goal reached badge
  const { data: lb } = await supabase
    .from('leaderboard')
    .select('total, goal')
    .eq('member_id', member_id)
    .eq('challenge_id', challenge_id)
    .maybeSingle()
  if (lb?.goal && Number(lb.total) >= Number(lb.goal)) {
    await awardBadge({ member_id, type: 'goal_reached', label: 'Goal reached! 🎯', emoji: '🏆', challenge_id })
  }
}
