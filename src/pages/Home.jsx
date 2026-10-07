import { useMemo } from 'react'
import Avatar from '../components/Avatar.jsx'
import Bottle from '../components/Bottle.jsx'
import BarChart from '../components/BarChart.jsx'
import { progressPct, weeklyBars } from '../lib/hydrate.js'
import { t, dateLocale, fmtNum } from '../lib/i18n.js'

export default function Home({
  state,
  totalToday,
  goal,
  goalGlasses,
  glassesToday,
  streak,
  due,
  nextLabel,
  onLog,
  onUndo
}) {
  const pct = progressPct(totalToday, goal)
  const bars = useMemo(() => weeklyBars(state.entries, goal, 7), [state.entries, goal])
  const canUndo = totalToday > 0
  const today = new Date()
  const showNext = nextLabel != null && !due

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">
            {state.name ? t('home.ciao', { name: state.name }) : 'Hydrate'}
          </p>
          <p className="text-xs capitalize text-slate-500">
            {today.toLocaleDateString(dateLocale(), {
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
          <span className="text-sm font-semibold text-slate-200">{t('home.streak', { n: streak })}</span>
        </div>
      </header>

      <section className="flex flex-col items-center">
        <Avatar pct={pct} />
        <Bottle pct={pct} />
        <p className="mt-3 text-5xl font-semibold tabular-nums text-cyan-300">{Math.round(pct)}%</p>
        <p className="mt-1 text-sm text-slate-400">{t('home.pctLabel')}</p>
        <p className="mt-1 text-sm text-slate-500">
          {t('home.mlOf', { total: fmtNum(totalToday), goal: fmtNum(goal) })} ·{' '}
          {glassesToday}/{goalGlasses} {t('home.glassWord')}
        </p>
        {showNext && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-400" fill="currentColor" aria-hidden="true">
              <path d="M12 2c1 4-2 5-2 8a4 4 0 0 0 8 0c0-1-.5-2-1-3 3 2 5 5 5 8a9 9 0 0 1-18 0c0-5 5-8 8-13z" />
            </svg>
            {t('home.next', { when: nextLabel })}
          </p>
        )}
      </section>

      {due && (
        <button
          onClick={() => onLog(state.glassMl)}
          className="anim-pulse flex items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-left transition active:scale-[0.99]"
        >
          <span>
            <span className="block text-sm font-semibold text-amber-200">{t('home.pill.title')}</span>
            <span className="block text-xs text-amber-300/80">{t('home.pill.body')}</span>
          </span>
          <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950">
            {t('home.pill.sip')}
          </span>
        </button>
      )}

      <section className="flex items-stretch gap-3">
        <button
          onClick={() => onLog(state.glassMl)}
          aria-label={t('home.add.aria')}
          className="flex-1 rounded-2xl bg-gradient-to-b from-cyan-400 to-sky-500 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition active:scale-[0.98]"
        >
          {t('home.sip')}
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={t('home.undo.aria')}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-300 transition active:scale-[0.98] disabled:opacity-40"
        >
          ↩
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">{t('home.week')}</h2>
          <span className="text-xs text-slate-500">{t('home.week.goal', { n: goalGlasses })}</span>
        </div>
        <BarChart bars={bars} goal={goal} height={80} labels />
      </section>
    </div>
  )
}