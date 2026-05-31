import { useState, useEffect, useCallback } from 'react'
import { getStreaks } from '../lib/queries'
import { useRealtime } from '../hooks/useRealtime'
import Avatar from './Avatar'

export default function StreakBoard() {
  const [streaks, setStreaks] = useState([])

  const load = useCallback(async () => {
    const data = await getStreaks()
    setStreaks(data)
  }, [])

  useEffect(() => { load() }, [load])
  useRealtime('activities', load)

  if (!streaks.length) return null

  return (
    <div className="card space-y-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">🔥 Active streaks</p>
      <div className="space-y-2">
        {streaks.map(s => (
          <div key={s.member_id} className="flex items-center gap-3">
            <Avatar name={s.member_name} initials={s.member_name.slice(0,2).toUpperCase()} color={s.color} size="sm" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">{s.member_name}</span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-medium text-gray-900">🔥 {s.current_streak} day{s.current_streak !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-400">best: {s.best_streak}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
