import { useMemo } from 'react'
import Avatar from '../components/Avatar.jsx'
import Bottle from '../components/Bottle.jsx'
import BarChart from '../components/BarChart.jsx'
import { progressPct, weeklyBars } from '../lib/hydrate.js'

export default function Home({
  state,
  totalToday,
  goal,
  goalGlasses,
  glassesToday,
  streak,
  onLog,
  onUndo
}) {
  const pct = progressPct(totalToday, goal)
  const bars = useMemo(() => weeklyBars(state.entries, goal, 7), [state.entries, goal])
  const canUndo = totalToday > 0
  const today = new Date()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">
            {state.name ? `Ciao, ${state.name}` : 'Hydrate'}
          </p>
          <p className="text-xs capitalize text-slate-500">
            {today.toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-400" fill="currentColor" aria-hidden="true">
            <path d="M12 2c1 4-2 5-2 8a4 4 0 0 0 8 0c0-1-.5-2-1-3 3 2 5 5 5 8a9 9 0 0 1-18 0c0-5 5-8 8-13z" />
          </svg>
          <span className="text-sm font-semibold text-slate-200">{streak} gg</span>
        </div>
      </header>

      <section className="flex flex-col items-center">
        <Avatar pct={pct} />
        <Bottle pct={pct} />
        <p className="mt-3 text-3xl font-semibold tabular-nums">
          {glassesToday}
          <span className="text-lg font-normal text-slate-400"> / {goalGlasses} bicchieri</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {totalToday} / {goal} ml · {Math.round(pct)}% di oggi
        </p>
      </section>

      <section className="flex items-stretch gap-3">
        <button
          onClick={() => onLog(state.glassMl)}
          aria-label="Aggiungi un bicchiere"
          className="flex-1 rounded-2xl bg-gradient-to-b from-cyan-400 to-sky-500 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition active:scale-[0.98]"
        >
          + un bicchiere
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Annulla l’ultimo bicchiere"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-300 transition active:scale-[0.98] disabled:opacity-40"
        >
          ↩
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Ultimi 7 giorni</h2>
          <span className="text-xs text-slate-500">obiettivo {goalGlasses} bicchieri</span>
        </div>
        <BarChart bars={bars} goal={goal} height={80} labels />
      </section>
    </div>
  )
}
