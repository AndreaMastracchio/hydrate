export default function Heatmap({ bars, goal }) {
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {bars.map((b) => {
        const pct = goal > 0 ? b.total / goal : 0
        const color = b.met
          ? 'bg-cyan-400'
          : pct >= 0.5
            ? 'bg-cyan-700'
            : pct > 0
              ? 'bg-cyan-900'
              : 'bg-slate-800'
        return (
          <div
            key={b.key}
            title={`${b.key}: ${b.total} ml`}
            className={`aspect-square rounded ${color}`}
          />
        )
      })}
    </div>
  )
}
