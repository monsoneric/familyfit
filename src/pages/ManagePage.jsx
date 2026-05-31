import { useState, useEffect } from 'react'
import {
  getMembers, addMember, getChallenges,
  createChallenge, updateChallengeMembers, archiveChallenge,
} from '../lib/queries'
import Avatar from '../components/Avatar'

const MEMBER_COLORS = [
  '#1D9E75','#7F77DD','#D85A30','#378ADD','#D4537E','#BA7517','#639922','#888780',
]

function initFrom(name) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

const BLANK_FORM = {
  name: '', metric: 'steps', goal: '', type: 'individual',
  starts_at: new Date().toISOString().slice(0, 10),
  ends_at:   new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  member_ids: [],
}

// Push notification toggle — wrapped separately so errors don't crash the page
function PushToggle({ member }) {
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [supported,  setSupported]  = useState(false)

  useEffect(() => {
    try {
      const ok = 'serviceWorker' in navigator && 'PushManager' in window
      setSupported(ok)
      if (ok) {
        navigator.serviceWorker.ready.then(reg =>
          reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
        ).catch(() => {})
      }
    } catch (e) {
      setSupported(false)
    }
  }, [])

  async function toggle() {
    setLoading(true)
    try {
      const reg  = await navigator.serviceWorker.ready
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        setSubscribed(false)
      } else {
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
        if (!vapidKey) throw new Error('No VAPID key')
        const padding  = '='.repeat((4 - vapidKey.length % 4) % 4)
        const base64   = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/')
        const raw      = atob(base64)
        const key      = Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
        const perm     = await Notification.requestPermission()
        if (perm !== 'granted') { setLoading(false); return }
        await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
        setSubscribed(true)
      }
    } catch (e) {
      console.error('Push toggle error:', e)
    }
    setLoading(false)
  }

  if (!supported) return null

  return (
    <div className="rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">
        🔔
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Push notifications</p>
        <p className="text-xs text-gray-400">
          {subscribed ? "On — you'll hear when others log" : 'Get notified when family logs'}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
          subscribed
            ? 'border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400'
            : 'bg-brand text-white hover:bg-brand-dark'
        }`}
      >
        {loading ? '…' : subscribed ? 'Turn off' : 'Turn on'}
      </button>
    </div>
  )
}

export default function ManagePage({ member: activeMember }) {
  const [members,      setMembers]      = useState([])
  const [challenges,   setChallenges]   = useState([])
  const [newName,      setNewName]      = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [editingCh,    setEditingCh]    = useState(null)
  const [form,         setForm]         = useState(BLANK_FORM)
  const [saving,       setSaving]       = useState(false)
  const [loadError,    setLoadError]    = useState(false)

  async function load() {
    try {
      const [m, c] = await Promise.all([getMembers(), getChallenges()])
      setMembers(m)
      setChallenges(c)
    } catch (e) {
      console.error('ManagePage load error:', e)
      setLoadError(true)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAddMember(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setAddingMember(true)
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length]
    await addMember({ name: newName.trim(), initials: initFrom(newName), color })
    setNewName('')
    await load()
    setAddingMember(false)
  }

  function toggleMember(id) {
    setForm(f => ({
      ...f,
      member_ids: f.member_ids.includes(id)
        ? f.member_ids.filter(x => x !== id)
        : [...f.member_ids, id],
    }))
  }

  function openNewChallenge() {
    setForm({ ...BLANK_FORM, member_ids: members.map(m => m.id) })
    setEditingCh(null)
    setShowForm(true)
  }

  function openEditChallenge(ch) {
    setForm({
      name:       ch.name, metric: ch.metric, goal: ch.goal ?? '', type: ch.type,
      starts_at:  ch.starts_at.slice(0, 10),
      ends_at:    ch.ends_at.slice(0, 10),
      member_ids: ch.challenge_members?.map(cm => cm.member_id) ?? [],
    })
    setEditingCh(ch)
    setShowForm(true)
  }

  async function handleSaveChallenge(e) {
    e.preventDefault()
    if (!form.name || form.member_ids.length === 0) {
      alert('Add a name and select at least one participant.')
      return
    }
    setSaving(true)
    if (editingCh) {
      await updateChallengeMembers(editingCh.id, form.member_ids)
    } else {
      await createChallenge({
        ...form,
        goal:      form.goal ? Number(form.goal) : null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at:   new Date(form.ends_at + 'T23:59:59').toISOString(),
        created_by: activeMember.id,
      })
    }
    setForm(BLANK_FORM)
    setShowForm(false)
    setEditingCh(null)
    await load()
    setSaving(false)
  }

  async function handleArchive(id) {
    if (!confirm('Archive this challenge? It will be hidden but data is preserved.')) return
    await archiveChallenge(id)
    await load()
  }

  if (loadError) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
      <p className="text-3xl mb-2">⚠️</p>
      <p className="font-medium">Couldn't load the page</p>
      <button onClick={() => { setLoadError(false); load() }}
        className="btn-outline mt-4 mx-auto">Try again</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Connections */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Connections</h2>
        <div className="card space-y-3">
          <PushToggle member={activeMember} />
        </div>
      </section>

      {/* Roster */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Family roster</h2>
        <div className="card divide-y divide-gray-50 p-0 overflow-hidden">
          {members.map(m => {
            const inChallenges = challenges.filter(c =>
              c.challenge_members?.some(cm => cm.member_id === m.id)
            )
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.name} initials={m.initials} color={m.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {m.name}
                    {m.id === activeMember.id && (
                      <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">you</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inChallenges.length > 0
                      ? inChallenges.map(c => c.name.split(' ').slice(0,2).join(' ')).join(', ')
                      : 'No active challenges'}
                  </p>
                </div>
              </div>
            )
          })}
          <form onSubmit={handleAddMember} className="flex gap-2 px-4 py-3">
            <input type="text" className="input flex-1" placeholder="Add family member…"
              value={newName} onChange={e => setNewName(e.target.value)} />
            <button type="submit" className="btn-outline shrink-0" disabled={addingMember}>
              {addingMember ? '…' : 'Add'}
            </button>
          </form>
        </div>
      </section>

      {/* Challenges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Challenges</h2>
          <button className="btn-outline text-xs py-1" onClick={openNewChallenge}>+ New challenge</button>
        </div>

        {showForm && (
          <form onSubmit={handleSaveChallenge} className="card space-y-4 mb-4">
            <h3 className="font-medium text-gray-900">
              {editingCh ? `Edit "${editingCh.name}"` : 'Create a challenge'}
            </h3>
            {!editingCh && (
              <>
                <div>
                  <label className="label">Challenge name</label>
                  <input className="input" placeholder="e.g. June Distance Challenge"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Metric</label>
                    <select className="input" value={form.metric}
                      onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
                      <option value="steps">Steps</option>
                      <option value="distance">Distance (miles)</option>
                      <option value="duration">Duration (min)</option>
                      <option value="activities">Activities (count)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Goal (blank = open-ended)</label>
                    <input type="number" className="input" placeholder="e.g. 300000"
                      value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type</label>
                    <select className="input" value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="individual">Individual</option>
                      <option value="team">Team</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start date</label>
                    <input type="date" className="input" value={form.starts_at}
                      onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">End date</label>
                    <input type="date" className="input" value={form.ends_at}
                      onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                  </div>
                </div>
              </>
            )}
            {editingCh && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                Metric, goal, and dates are locked after creation. Add or remove participants below.
              </p>
            )}
            <div>
              <label className="label">Participants</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {members.map(m => (
                  <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      form.member_ids.includes(m.id)
                        ? 'border-brand bg-brand-light text-brand-dark font-medium'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? 'Saving…' : editingCh ? 'Save participants' : 'Create challenge'}
              </button>
              <button type="button" className="btn-outline"
                onClick={() => { setShowForm(false); setEditingCh(null) }}>Cancel</button>
            </div>
          </form>
        )}

        <div className="card divide-y divide-gray-50 p-0 overflow-hidden">
          {challenges.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No challenges yet</p>
          ) : challenges.map(c => {
            const participants = members.filter(m =>
              c.challenge_members?.some(cm => cm.member_id === m.id)
            )
            const daysLeft = Math.max(0, Math.ceil((new Date(c.ends_at) - new Date()) / 86400000))
            return (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.metric} · {daysLeft === 0 ? 'Ended' : `${daysLeft}d left`} · {participants.map(m => m.name).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => openEditChallenge(c)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Edit</button>
                    <button onClick={() => handleArchive(c.id)}
                      className="text-xs text-gray-400 hover:text-red-400 transition-colors">Archive</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
