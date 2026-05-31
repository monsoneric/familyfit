import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { getDailyTotals, getCumulativeTotals } from '../lib/queries'

function fmt(val, metric) {
  if (!val && val !== 0) return '—'
  if (metric === 'distance') return `${Number(val).toFixed(1)} mi`
  if (metric === 'steps')    return `${Number(val).toLocaleString()} steps`
  if (metric === 'duration') return `${Math.round(val)} min`
  return Math.round(val)
}

function shortDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function ProgressChart({ challenge }) {
  const [view,    setView]    = useState('cumulative')   // 'cumulative' | 'daily'
  const [data,    setData]    = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!challenge) return
    setLoading(true)

    const fn = view === 'cumulative' ? getCumulativeTotals : getDailyTotals
    fn(challenge.id).then(rows => {
      // Build unique member list
      const memberMap = {}
      rows.forEach(r => { memberMap[r.member_id] = { name: r.member_name, color: r.color } })
      const memberList = Object.entries(memberMap).map(([id, m]) => ({ id, ...m }))
      setMembers(memberList)

      // Build chart data: one entry per day, columns per member
      const byDay = {}
      rows.forEach(r => {
        if (!byDay[r.day]) byDay[r.day] = { day: shortDate(r.day) }
        byDay[r.day][r.member_name] = Number(r[view === 'cumulative' ? 'running_total' : 'daily_total'])
      })
      setData(Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)))
      setLoading(false)
    })
  }, [challenge, view])

  if (!challenge) return null

  const metric  = challenge.metric
  const isEmpty = data.length === 0

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Progress chart</p>
        <div className="flex gap-1">
          {['cumulative', 'daily'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                view === v ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {v === 'cumulative' ? 'Cumulative' : 'Daily'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : isEmpty ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          Log some activities to see the chart
        </div>
      ) : view === 'cumulative' ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => {
              if (metric === 'steps' && v >= 1000) return `${Math.round(v/1000)}k`
              return v
            }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v, name) => [fmt(v, metric), name]}
            />
            {members.map(m => (
              <Line
                key={m.id}
                type="monotone"
                dataKey={m.name}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => {
              if (metric === 'steps' && v >= 1000) return `${Math.round(v/1000)}k`
              return v
            }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v, name) => [fmt(v, metric), name]}
            />
            {members.map(m => (
              <Bar key={m.id} dataKey={m.name} fill={m.color} radius={[3,3,0,0]} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      {!isEmpty && (
        <div className="flex flex-wrap gap-3 pt-1">
          {members.map(m => (
            <span key={m.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
              {m.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
