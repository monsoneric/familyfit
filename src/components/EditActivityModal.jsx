import { useState } from 'react'
import { updateActivity, deleteActivity } from '../lib/queries'

const ACTIVITY_TYPES = [
  'Walking','Running','Hiking','Cycling','Swimming',
  'Elliptical','Yoga','Strength training','Rowing',
  'HIIT','Pilates','Dance','Basketball','Soccer',
  'Tennis','Golf','Skiing','Skating','Steps only','Other',
]

export default function EditActivityModal({ activity, onClose, onSaved }) {
  const [form, setForm] = useState({
    type:     activity.type     ?? 'Walking',
    steps:    activity.steps    ?? '',
    distance: activity.distance ?? '',
    duration: activity.duration ?? '',
    note:     activity.note     ?? '',
  })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await updateActivity(activity.id, {
      type:     form.type,
      steps:    form.steps    ? Number(form.steps)    : null,
      distance: form.distance ? Number(form.distance) : null,
      duration: form.duration ? Number(form.duration) : null,
      note:     form.note || null,
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    await deleteActivity(activity.id)
    onSaved()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Edit activity</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="px-5 py-4 space-y-3">
          <div>
            <label className="label">Activity type</label>
            <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
              {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Steps</label>
              <input type="number" className="input" min="0" value={form.steps}
                onChange={e => set('steps', e.target.value)} placeholder="e.g. 8500" />
            </div>
            <div>
              <label className="label">Distance (mi)</label>
              <input type="number" className="input" min="0" step="0.1" value={form.distance}
                onChange={e => set('distance', e.target.value)} placeholder="e.g. 3.2" />
            </div>
          </div>

          <div>
            <label className="label">Duration (min)</label>
            <input type="number" className="input" min="0" value={form.duration}
              onChange={e => set('duration', e.target.value)} placeholder="e.g. 45" />
          </div>

          <div>
            <label className="label">Note</label>
            <input type="text" className="input" value={form.note}
              onChange={e => set('note', e.target.value)} placeholder="Optional" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`btn px-3 rounded-lg text-sm border transition-colors ${
                confirm
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                  : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
              }`}
            >
              {deleting ? '…' : confirm ? 'Confirm delete' : '🗑'}
            </button>
          </div>
          {confirm && <p className="text-xs text-red-400 text-center -mt-1">Click again to confirm deletion</p>}
        </form>
      </div>
    </div>
  )
}
