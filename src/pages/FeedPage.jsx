import { useState, useEffect, useCallback } from 'react'
import { getAllRecentActivities } from '../lib/queries'
import { useRealtime } from '../hooks/useRealtime'
import Avatar from '../components/Avatar'
import ReactionBar from '../components/ReactionBar'
import EditActivityModal from '../components/EditActivityModal'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function activitySummary(a) {
  const parts = []
  if (a.steps)    parts.push(`${Number(a.steps).toLocaleString()} steps`)
  if (a.distance) parts.push(`${Number(a.distance).toFixed(1)} mi`)
  if (a.duration) parts.push(`${Math.round(a.duration)} min`)
  return parts.join(' · ') || a.type
}

export default function FeedPage({ member }) {
  const [activities,  setActivities]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [editing,     setEditing]     = useState(null)   // activity being edited

  const load = useCallback(async () => {
    const data = await getAllRecentActivities(60)
    setActivities(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useRealtime('activities', load)
  useRealtime('reactions',  load)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Recent activity</h2>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading…</div>
      ) : activities.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">👟</p>
          <p className="font-medium">No activities yet</p>
          <p className="text-sm mt-1">Log the first one to get things started</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50 p-0 overflow-hidden">
          {activities.map(a => {
            const isOwn = a.member_id === member.id
            return (
              <div key={a.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={a.members?.name}
                    initials={a.members?.initials}
                    color={a.members?.color}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{a.members?.name}</span>
                          {' '}logged {a.note || a.type}
                          {a.challenges?.name && (
                            <span className="text-gray-400 text-xs ml-1">
                              [{a.challenges.name.split(' ').slice(0,2).join(' ')}]
                            </span>
                          )}
                        </p>
                        <p
                          className="text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full"
                          style={{
                            background: (a.members?.color ?? '#1D9E75') + '18',
                            color: a.members?.color ?? '#1D9E75',
                          }}
                        >
                          {activitySummary(a)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{timeAgo(a.logged_at)}</span>
                        {isOwn && (
                          <button
                            onClick={() => setEditing(a)}
                            className="text-gray-300 hover:text-gray-500 transition-colors text-sm"
                            title="Edit activity"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reactions */}
                    <ReactionBar activityId={a.id} member={member} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <EditActivityModal
          activity={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
