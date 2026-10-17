import { useState } from 'react'
import { t } from '../lib/i18n.js'
import { habitsToSchedule, HABIT_DEFAULTS } from '../lib/hydrate.js'
import HabitsForm from './HabitsForm.jsx'

const hh = (h) => `${String(h).padStart(2, '0')}:00`

export default function Onboarding({ goal, glassMl, onDone }) {
  const [hb, setHb] = useState(HABIT_DEFAULTS)
  const setHabit = (patch) => setHb((h) => ({ ...h, ...patch }))
  const setMeal = (k, v) => setHb((h) => ({ ...h, meals: { ...h.meals, [k]: v } }))
  const setWorkout = (patch) => setHb((h) => ({ ...h, workout: { ...h.workout, ...patch } }))

  const plan = habitsToSchedule(hb, { goalMl: goal, glassMl: glassMl || 250 })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 px-5 py-8 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header>
          <h1 className="text-lg font-semibold text-slate-100">{t('onb.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('onb.sub')}</p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <HabitsForm hb={hb} setHabit={setHabit} setMeal={setMeal} setWorkout={setWorkout} />
        </section>

        {plan && (
          <section className="rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-4">
            <p className="text-sm text-slate-200">
              {t('prof.plan.window', { s: hh(plan.startHour), e: hh(plan.endHour) })}
            </p>
            <p className="mt-1 text-sm text-slate-200">{t('prof.plan.every', { n: plan.intervalMin })}</p>
          </section>
        )}

        <button
          onClick={() => onDone(hb)}
          className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
        >
          {t('onb.start')}
        </button>
        <button
          onClick={() => onDone(HABIT_DEFAULTS)}
          className="w-full rounded-xl border border-slate-700 py-2.5 text-sm text-slate-400 transition hover:border-slate-500"
        >
          {t('onb.skip')}
        </button>
      </div>
    </div>
  )
}
