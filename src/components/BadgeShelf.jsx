import { useState, useEffect } from 'react'
import { getBadges } from '../lib/queries'

export default function BadgeShelf({ memberId, memberName }) {
  const [badges,   setBadges]   = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (memberId) getBadges(memberId).then(setBadges)
  }, [memberId])

  if (!badges.length) return null

  const visible = expanded ? badges : badges.slice(0, 6)

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {memberName ? `${memberName}'s badges` : 'Your badges'}
        </p>
        {badges.length > 6 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-brand hover:text-brand-dark"
          >
            {expanded ? 'Show less' : `+${badges.length - 6} more`}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map(b => (
          <div
            key={b.id}
            title={`${b.label} — earned ${new Date(b.earned_at).toLocaleDateString()}`}
            className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 text-sm"
          >
            <span>{b.emoji}</span>
            <span className="text-gray-700 text-xs font-medium">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
