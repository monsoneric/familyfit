export default function ProgressBar({ value, max, color }) {
  const pct = max ? Math.min(Math.round((value / max) * 100), 100) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
