const BOTTLE_PATH =
  'M42 10 h16 v14 q0 8 8 14 q12 9 14 26 v96 q0 24 -24 24 H44 q-24 0 -24 -24 V64 q2 -17 14 -26 q8 -6 8 -14 z'
const WAVE_PATH =
  'M-70 0 q15 -7 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V220 H-70 Z'

const BODY_TOP = 64
const BODY_BOTTOM = 184

export default function Bottle({ pct }) {
  const p = Math.max(0, Math.min(100, pct))
  const level = BODY_BOTTOM - (p / 100) * (BODY_BOTTOM - BODY_TOP)
  return (
    <svg viewBox="0 0 100 210" className="h-56 w-auto" role="img" aria-label={`Bottiglia piena al ${Math.round(p)}%`}>
      <defs>
        <clipPath id="bottleClip">
          <path d={BOTTLE_PATH} />
        </clipPath>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect x="41" y="0" width="18" height="12" rx="3" fill="#334155" />
      <path d={BOTTLE_PATH} fill="rgba(148,163,184,0.05)" />
      {p > 0 && (
        <g clipPath="url(#bottleClip)">
          <g
            style={{
              transform: `translateY(${level}px)`,
              transition: 'transform 700ms cubic-bezier(.4,0,.2,1)'
            }}
          >
            <rect x="-10" y="0" width="120" height="220" fill="url(#waterGrad)" />
            <path className="wave" d={WAVE_PATH} fill="rgba(255,255,255,0.22)" />
          </g>
        </g>
      )}
      <path
        d={BOTTLE_PATH}
        fill="none"
        stroke="rgba(148,163,184,0.55)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
