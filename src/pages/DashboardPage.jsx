import { useState, useEffect, useCallback } from 'react'
import { getChallenges, getLeaderboard } from '../lib/queries'
import { useRealtime } from '../hooks/useRealtime'
import Avatar from '../components/Avatar'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import ProgressChart from '../components/ProgressChart'
import StreakBoard from '../components/StreakBoard'
import BadgeShelf from '../components/BadgeShelf'

function formatVal(val, metric) {
  if (!val && val !== 0) return '—'
  if (metric === 'distance') return Number(val).toFixed(1)
  if (metric === 'steps')    return Number(val).toLocaleString()
  return Math.round(val)
}

function metricUnit(metric) {
  return { steps: 'steps', distance: 'mi', duration: 'min', activities: 'activities' }[metric] ?? ''
}

export default function DashboardPage({ member }) {
  const [challenges,   setChallenges]   = useState([])
  const [activeIdx,    setActiveIdx]    = useState(0)
  const [leaderboard,  setLeaderboard]  = useState([])
  const [loadingBoard, setLoadingBoard] = useState(false)
  const [view,         setView]         = useState('leaderboard')

  const loadChallenges = useCallback(async () => {
    const data = await getChallenges()
    setChallenges(data)
  }, [])

  const loadLeaderboard = useCallback(async () => {
    if (!challenges[activeIdx]) return
    setLoadingBoard(true)
    const data = await getLeaderboard(challenges[activeIdx].id)
    setLeaderboard(data)
    setLoadingBoard(false)
  }, [challenges, activeIdx])

  useEffect(() => { loadChallenges() }, [loadChallenges])
  useEffect(() => { loadLeaderboard() }, [loadLeaderboard])
  useRealtime('activities', loadLeaderboard)

  const ch              = challenges[activeIdx]
  const totalActivities = leaderboard.reduce((s, r) => s + Number(r.activity_count), 0)
  const totalVal        = leaderboard.reduce((s, r) => s + Number(r.total), 0)
  const daysLeft        = ch ? Math.max(0, Math.ceil((new Date(ch.ends_at) - new Date()) / 86400000)) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Challenge tabs */}
      {challenges.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {challenges.map((c, i) => (
            <button key={c.id} onClick={() => { setActiveIdx(i); setView('leaderboard') }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors border ${
                i === activeIdx
                  ? 'bg-brand text-white border-brand font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === activeIdx ? 'bg-white' : 'bg-brand'}`} />
              {c.name}
            </button>
          ))}
        </div>
      )}

      {!ch ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🎯</p>
          <p className="font-medium">No active challenges</p>
          <p className="text-sm mt-1">Head to Manage to create one</p>
        </div>
      ) : (
        <>
          {/* Challenge header */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-medium text-gray-900">{ch.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {ch.goal ? `Goal: ${formatVal(ch.goal, ch.metric)} ${metricUnit(ch.metric)}` : 'Open-ended'} · {ch.type}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                daysLeft <= 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
              }`}>
                {daysLeft === 0 ? 'Ended' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <StatCard
                label="Total"
                value={ch.metric === 'steps' ? `${Math.round(totalVal / 1000)}k` : formatVal(totalVal, ch.metric)}
                unit={metricUnit(ch.metric)}
              />
              <StatCard label="Members" value={leaderboard.length} />
              <StatCard label="Activities" value={totalActivities} />
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[['leaderboard', '🏆 Leaderboard'], ['chart', '📈 Progress']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  view === v ? 'bg-white text-gray-900 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {view === 'chart' ? (
            <ProgressChart challenge={ch} />
          ) : (
            <div className="card divide-y divide-gray-50">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">
                {metricUnit(ch.metric)} toward {ch.goal ? formatVal(ch.goal, ch.metric) : 'max'}
              </p>
              {loadingBoard ? (
                <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
              ) : leaderboard.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No activities yet — be the first!</div>
              ) : (
                leaderboard.map((row, i) => {
                  const pct   = ch.goal ? Math.min(Math.round((row.total / ch.goal) * 100), 100) : 0
                  const isYou = row.member_id === member.id
                  return (
                    <div key={row.member_id}
                      className={`flex items-center gap-3 py-3 ${isYou ? 'bg-brand/5 -mx-4 px-4 rounded-lg' : ''}`}
                    >
                      <span className={`w-5 text-center text-sm font-medium ${i === 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                      <Avatar name={row.member_name} initials={row.initials} color={row.color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900">{row.member_name}</span>
                          {isYou && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">you</span>}
                        </div>
                        <ProgressBar value={row.total} max={ch.goal || totalVal} color={row.color} />
                        <span className="text-xs text-gray-400 mt-0.5 block">
                          {ch.goal ? `${pct}% of goal` : `${row.activity_count} activities`}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 text-right min-w-[72px]">
                        {formatVal(row.total, ch.metric)}
                        <span className="text-xs text-gray-400 ml-1">{metricUnit(ch.metric)}</span>
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Streaks — always visible below challenge */}
      <StreakBoard />

      {/* Your badges */}
      <BadgeShelf memberId={member.id} memberName={null} />
    </div>
  )
}
