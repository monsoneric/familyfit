import { useState, useEffect, useCallback } from 'react'
import { getReactions, toggleReaction } from '../lib/queries'

const EMOJI_OPTIONS = ['👏','🔥','💪','🎉','⭐','😮']

// Groups reactions by emoji and returns counts + who reacted
function groupReactions(reactions) {
  const groups = {}
  reactions.forEach(r => {
    if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, count: 0, names: [] }
    groups[r.emoji].count++
    groups[r.emoji].names.push(r.members?.name ?? 'Someone')
  })
  return Object.values(groups)
}

export default function ReactionBar({ activityId, member, compact = false }) {
  const [reactions,   setReactions]   = useState([])
  const [showPicker,  setShowPicker]  = useState(false)
  const [busy,        setBusy]        = useState(false)

  const load = useCallback(async () => {
    const data = await getReactions([activityId])
    setReactions(data)
  }, [activityId])

  useEffect(() => { load() }, [load])

  async function handleEmoji(emoji) {
    if (busy) return
    setBusy(true)
    setShowPicker(false)
    await toggleReaction({ activity_id: activityId, member_id: member.id, emoji })
    await load()
    setBusy(false)
  }

  const grouped  = groupReactions(reactions)
  const myEmojis = reactions.filter(r => r.member_id === member.id).map(r => r.emoji)

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5 relative">
      {/* Existing reactions */}
      {grouped.map(g => (
        <button
          key={g.emoji}
          onClick={() => handleEmoji(g.emoji)}
          title={g.names.join(', ')}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
            myEmojis.includes(g.emoji)
              ? 'bg-brand-light border-brand/30 text-brand-dark font-medium'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {g.emoji} <span>{g.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(s => !s)}
          className="px-1.5 py-0.5 rounded-full text-xs border border-gray-200 text-gray-400 hover:border-gray-300 transition-colors"
          title="Add reaction"
        >
          + 😊
        </button>
        {showPicker && (
          <div className="absolute bottom-7 left-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => handleEmoji(e)}
                className="text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
