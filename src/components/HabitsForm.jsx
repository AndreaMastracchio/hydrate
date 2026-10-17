import { t } from '../lib/i18n.js'
import Toggle from './Toggle.jsx'

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-500'

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 rounded-xl border px-2 py-2 text-sm transition ${
      active
        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
        : 'border-slate-700 bg-slate-950 text-slate-300'
    }`}
  >
    {children}
  </button>
)

export default function HabitsForm({ hb, setHabit, setMeal, setWorkout }) {
  return (
    <div>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
          {t('prof.h.wake')}
          <input className={inputCls} type="time" value={hb.wake} onChange={(e) => setHabit({ wake: e.target.value })} />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
          {t('prof.h.sleep')}
          <input className={inputCls} type="time" value={hb.sleep} onChange={(e) => setHabit({ sleep: e.target.value })} />
        </label>
      </div>

      <p className="mb-1 mt-4 text-xs text-slate-400">{t('prof.h.meals')}</p>
      <div className="flex gap-3">
        {[
          ['breakfast', t('prof.h.breakfast')],
          ['lunch', t('prof.h.lunch')],
          ['dinner', t('prof.h.dinner')]
        ].map(([k, l]) => (
          <label key={k} className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
            {l}
            <input className={inputCls} type="time" value={hb.meals[k]} onChange={(e) => setMeal(k, e.target.value)} />
          </label>
        ))}
      </div>

      <p className="mb-1 mt-4 text-xs text-slate-400">{t('prof.h.workout')}</p>
      <div className="flex gap-2">
        {[
          ['none', t('prof.h.workout.none')],
          ['light', t('prof.h.workout.light')],
          ['intense', t('prof.h.workout.intense')]
        ].map(([k, l]) => (
          <Chip key={k} active={hb.workout.type === k} onClick={() => setWorkout({ type: k })}>
            {l}
          </Chip>
        ))}
      </div>
      {hb.workout.type !== 'none' && (
        <label className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
          {t('prof.h.workout.time')}
          <input className={inputCls} type="time" value={hb.workout.time} onChange={(e) => setWorkout({ time: e.target.value })} />
        </label>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{t('prof.h.alcohol')}</p>
        <Toggle label={t('prof.h.alcohol')} on={hb.alcohol} onChange={(v) => setHabit({ alcohol: v })} />
      </div>

      <label className="mt-4 flex flex-col gap-1 text-xs text-slate-400">
        {t('prof.h.coffee')}
        <input
          className={inputCls}
          type="number"
          min="0"
          max="8"
          value={hb.coffee}
          onChange={(e) => setHabit({ coffee: Math.max(0, Math.min(8, Number(e.target.value) || 0)) })}
        />
      </label>

      <p className="mb-1 mt-4 text-xs text-slate-400">{t('prof.h.dayType')}</p>
      <div className="flex gap-2">
        {[
          ['office', t('prof.h.day.office')],
          ['home', t('prof.h.day.home')],
          ['outdoor', t('prof.h.day.outdoor')]
        ].map(([k, l]) => (
          <Chip key={k} active={hb.dayType === k} onClick={() => setHabit({ dayType: k })}>
            {l}
          </Chip>
        ))}
      </div>
    </div>
  )
}
