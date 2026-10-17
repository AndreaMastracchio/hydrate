export default function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${on ? 'bg-cyan-500' : 'bg-slate-700'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white transition ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}
