const labelFor = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'narrow' })
}

export default function BarChart({ bars, goal, height = 96, labels = false }) {
  const max = Math.max(goal, ...bars.map((b) => b.total), 1)
  return (
    <div>
      <div className="relative flex items-end gap-1" style={{ height }}>
        {bars.map((b) => (
          <div
            key={b.key}
            className={`flex-1 rounded-t transition-all ${
              b.met ? 'bg-cyan-400' : b.total > 0 ? 'bg-cyan-900' : 'bg-slate-800'
            }`}
            style={{ height: `${Math.max((b.total / max) * 100, b.total > 0 ? 5 : 3)}%` }}
            title={`${b.key}: ${b.total} ml`}
          />
        ))}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-cyan-400/40"
          style={{ bottom: `${(goal / max) * 100}%` }}
        />
      </div>
      {labels && (
        <div className="mt-1.5 flex gap-1">
          {bars.map((b) => (
            <div key={b.key} className="flex-1 text-center text-[10px] text-slate-500">
              {labelFor(b.key)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
