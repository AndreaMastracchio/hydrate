export default function Avatar({ pct }) {
  const mood = pct >= 100 ? 'great' : pct < 20 ? 'sleepy' : 'ok'
  const mouthCurve = pct >= 100 ? 8 : pct < 20 ? -4 : pct < 50 ? 0 : 5
  return (
    <svg viewBox="0 0 80 80" className="bob h-20 w-20" aria-hidden="true">
      <defs>
        <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <path
        d="M40 6 C52 22 66 34 66 48 A26 26 0 0 1 14 48 C14 34 28 22 40 6 Z"
        fill="url(#dropGrad)"
      />
      <ellipse cx="31" cy="30" rx="7" ry="3.5" fill="#ffffff" opacity="0.4" transform="rotate(-24 31 30)" />
      {mood === 'happy' ? (
        <g stroke="#0b1220" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M28 42 Q31 38 34 42" />
          <path d="M46 42 Q49 38 52 42" />
        </g>
      ) : mood === 'sleepy' ? (
        <g stroke="#0b1220" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M28 44 Q31 42 34 44" />
          <path d="M46 44 Q49 42 52 44" />
        </g>
      ) : (
        <g fill="#0b1220">
          <circle cx="31" cy="44" r="3.5" />
          <circle cx="49" cy="44" r="3.5" />
        </g>
      )}
      <path
        d={`M32 54 Q40 ${54 + mouthCurve} 48 54`}
        fill="none"
        stroke="#0b1220"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="25" cy="52" r="4" fill="#f472b6" opacity="0.4" />
      <circle cx="55" cy="52" r="4" fill="#f472b6" opacity="0.4" />
    </svg>
  )
}