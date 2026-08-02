import { useState, useEffect } from 'react'
import { getChallenges, logActivity, checkAndAwardBadges, getRoutineSteps } from '../lib/queries'

const ACTIVITY_CATEGORIES = {
  'Cardio':      ['Walking','Running','Hiking','Cycling','Rowing','Elliptical','Jump rope','Stair climbing'],
  'Water':       ['Swimming','Kayaking','Paddleboarding','Water aerobics'],
  'Strength':    ['Strength training','HIIT','CrossFit','Kettlebell','Bodyweight'],
  'Flexibility': ['Yoga','Pilates','Stretching','Barre','Golf Mobility Stretch Routine'],
  'Sport':       ['Basketball','Soccer','Tennis','Golf','Volleyball','Pickleball','Skiing','Skating','Martial arts'],
  'Other':       ['Steps only','Walking (treadmill)','Cycling (stationary)','Other'],
}

function RoutineChecklist({ routineName }) {
  const [steps, setSteps]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getRoutineSteps(routineName).then(data => {
      if (active) { setSteps(data ?? []); setLoading(false) }
    })
    return () => { active = false }
  }, [routineName])

  if (loading) return <p className="text-xs text-gray-400">Loading routine…</p>
  if (!steps.length) return null

  const totalMinutes = steps.reduce((sum, s) => sum + Number(s.target_minutes), 0)

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">Routine checklist</p>
        <span className="text-xs text-gray-400">~{totalMinutes} min total</span>
      </div>
      <ul className="space-y-1.5">
        {steps.map(step => (
          <li key={step.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{step.step_order}. {step.name}</span>
            <a
              href={step.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-brand hover:underline whitespace-nowrap ml-3"
            >
              ▶ Watch
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LogPage({ member }) {
  const [challenges,  setChallenges]  = useState([])
  const [form, setForm] = useState({
    challenge_id: '',
    type:         'Walking',
    steps:        '',
    distance:     '',
    duration:     '',
    note:         '',
  })
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [newBadge, setNewBadge] = useState(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
    getChallenges().then(data => {
      const mine = data.filter(c =>
        c.challenge_members?.some(cm => cm.member_id === member.id)
      )
      setChallenges(mine)
      if (mine.length) setForm(f => ({ ...f, challenge_id: mine[0].id }))
    })
  }, [member.id])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const activeCh      = challenges.find(c => c.id === form.challenge_id)
  const isStepChallenge = activeCh?.metric === 'steps'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.challenge_id) { setError('Select a challenge.'); return }
    if (!form.steps && !form.distance && !form.duration) {
      setError('Enter at least one of: steps, distance, or duration.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let steps = form.steps ? Number(form.steps) : null
      if (isStepChallenge && !steps && form.distance) {
        steps = Math.round(Number(form.distance) * 2100)
      }
      await logActivity({
        member_id:    member.id,
        challenge_id: form.challenge_id,
        type:         form.type,
        steps,
        distance: form.distance ? Number(form.distance) : null,
        duration: form.duration ? Number(form.duration) : null,
        note:     form.note || null,
      })

      // Check for new badges
      await checkAndAwardBadges({ member_id: member.id, challenge_id: form.challenge_id })

      setForm(f => ({ ...f, steps: '', distance: '', duration: '', note: '' }))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <h2 className="font-medium text-gray-900">Log an activity</h2>
          <p className="text-sm text-gray-500 mt-0.5">Logging as <strong>{member.name}</strong></p>
        </div>

        <div>
          <label className="label">Challenge</label>
          <select className="input" value={form.challenge_id}
            onChange={e => set('challenge_id', e.target.value)}>
            {challenges.length === 0
              ? <option value="">No active challenges — join one in Manage</option>
              : challenges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
            }
          </select>
        </div>

        <div>
          <label className="label">Activity type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {Object.entries(ACTIVITY_CATEGORIES).map(([cat, types]) => (
              <optgroup key={cat} label={cat}>
                {types.map(t => <option key={t}>{t}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {form.type === 'Golf Mobility Stretch Routine' && (
          <RoutineChecklist routineName="Golf Mobility Stretch Routine" />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">
              Steps
              {isStepChallenge && form.distance && !form.steps && (
                <span className="text-brand ml-1">
                  (≈{Math.round(Number(form.distance) * 2100).toLocaleString()} est.)
                </span>
              )}
            </label>
            <input type="number" className="input" placeholder="e.g. 8500" min="0"
              value={form.steps} onChange={e => set('steps', e.target.value)} />
          </div>
          <div>
            <label className="label">Distance (miles)</label>
            <input type="number" className="input" placeholder="e.g. 3.2" step="0.1" min="0"
              value={form.distance} onChange={e => set('distance', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Duration (minutes)</label>
          <input type="number" className="input" placeholder="e.g. 45" min="0"
            value={form.duration} onChange={e => set('duration', e.target.value)} />
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <input type="text" className="input" placeholder="e.g. Morning walk around the lake"
            value={form.note} onChange={e => set('note', e.target.value)} />
        </div>

        {error   && <p className="text-sm text-red-500">{error}</p>}

        {success && (
          <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm space-y-1">
            <p className="font-medium">✓ Activity logged! Leaderboard updated.</p>
            {newBadge && (
              <p className="text-green-600">
                🎉 New badge: {newBadge.emoji} {newBadge.label}
              </p>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary w-full justify-center"
          disabled={saving || !challenges.length}>
          {saving ? 'Saving…' : '+ Log activity'}
        </button>
      </form>

      {isStepChallenge && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Tip: entering distance auto-estimates steps (~2,100 per mile)
        </p>
      )}
    </div>
  )
}
