const items = [
  {
    id: 'home',
    label: 'Oggi',
    icon: <path d="M12 3 C16 8 19 11 19 14 a7 7 0 0 1 -14 0 c0 -3 3 -6 7 -11 z" />
  },
  {
    id: 'stats',
    label: 'Grafici',
    icon: (
      <>
        <path d="M5 20V10" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
      </>
    )
  },
  {
    id: 'profile',
    label: 'Profilo',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </>
    )
  }
]

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] transition ${
                active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
