import { useMemo } from 'react'
import BarChart from '../components/BarChart.jsx'
import Heatmap from '../components/Heatmap.jsx'
import { weeklyBars, currentStreak, bestStreak, completionRate } from '../lib/hydrate.js'
import { t, fmtNum } from '../lib/i18n.js'

function Kpi({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{value}</p>
    </div>
  )
}

export default function Stats({ state, goal, goalGlasses }) {
  const { entries } = state
  const bars7 = useMemo(() => weeklyBars(entries, goal, 7), [entries, goal])
  const bars30 = useMemo(() => weeklyBars(entries, goal, 30), [entries, goal])

  const streak = currentStreak(entries, goal)
  const best = bestStreak(entries, goal)
  const avg7 = Math.round(bars7.reduce((a, b) => a + b.total, 0) / 7)
  const rate30 = Math.round(completionRate(entries, goal, 30) * 100)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">{t('stats.title')}</h1>
        <p className="text-xs text-slate-500">{t('stats.sub')}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Kpi label={t('kpi.streak')} value={t('home.streak', { n: streak })} />
        <Kpi label={t('kpi.best')} value={t('home.streak', { n: best })} />
        <Kpi label={t('kpi.avg')} value={`${fmtNum(avg7)} ml`} />
        <Kpi label={t('kpi.rate')} value={`${rate30}%`} />
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">{t('stats.week7')}</h2>
          <span className="text-xs text-slate-500">{t('home.week.goal', { n: goalGlasses })}</span>
        </div>
        <BarChart bars={bars7} goal={goal} height={110} labels />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">{t('stats.week30')}</h2>
          <span className="text-xs text-slate-500">{t('home.week.goal', { n: goalGlasses })}</span>
        </div>
        <BarChart bars={bars30} goal={goal} height={110} />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-300">{t('stats.month')}</h2>
        <Heatmap bars={bars30} goal={goal} />
        <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-slate-800" /> {t('leg.empty')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-cyan-900" /> {t('leg.low')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-cyan-700" /> {t('leg.mid')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-cyan-400" /> {t('leg.hi')}
          </span>
        </div>
      </section>
    </div>
  )
}