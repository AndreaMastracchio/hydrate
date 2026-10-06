export default function Avatar({ pct }) {
  const mouthCurve = pct < 33 ? -6 : pct < 66 ? 2 : 8
  return (
    <svg viewBox="0 0 80 80" className="bob h-16 w-16" aria-hidden="true">
      <defs>
        <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M40 6 C52 22 66 34 66 48 A26 26 0 0 1 14 48 C14 34 28 22 40 6 Z"
        fill="url(#dropGrad)"
      />
      <circle cx="31" cy="46" r="3.5" fill="#0b1220" />
      <circle cx="49" cy="46" r="3.5" fill="#0b1220" />
      <path
        d={`M32 56 Q40 ${56 + mouthCurve} 48 56`}
        fill="none"
        stroke="#0b1220"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="25" cy="54" r="4" fill="#f472b6" opacity="0.35" />
      <circle cx="55" cy="54" r="4" fill="#f472b6" opacity="0.35" />
    </svg>
  )
}
