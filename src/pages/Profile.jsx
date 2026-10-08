import { useEffect, useState } from 'react'
import { getPermission, requestPermission, syncPermission } from '../lib/notify.js'
import { goalBreakdown } from '../lib/hydrate.js'
import { t, dateLocale, fmtNum } from '../lib/i18n.js'

const hh = (h) => `${String(h).padStart(2, '0')}:00`
const factor = (f) => f.toLocaleString(dateLocale())

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-500'

function Toggle({ on, onChange, label }) {
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

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-300">{title}</h2>
      {children}
    </section>
  )
}

export default function Profile({ state, goal, goalGlasses, onUpdate, onSettings, onReset }) {
  const [perm, setPerm] = useState(getPermission)

  useEffect(() => {
    let alive = true
    syncPermission().then((p) => alive && setPerm(p))
    return () => {
      alive = false
    }
  }, [])

  const enableNotifications = async () => {
    const result = await requestPermission()
    setPerm(result)
    if (result === 'granted') onSettings({ enabled: true })
  }

  const permLabel = {
    granted: t('perm.granted'),
    denied: t('perm.denied'),
    default: t('perm.default'),
    unsupported: t('perm.denied')
  }[perm]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">{t('nav.profile')}</h1>
      </header>

      <Section title={t('profile.you')}>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          {t('profile.name')}
          <input
            className={inputCls}
            value={state.name}
            placeholder={t('profile.name')}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
          <span className="text-slate-600">{t('profile.name.hint')}</span>
        </label>
        <label className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
          {t('profile.weight')}
          <input
            className={inputCls}
            type="number"
            min="30"
            max="200"
            value={state.settings.weightKg ?? ''}
            placeholder="70"
            onChange={(e) =>
              onSettings({ weightKg: e.target.value ? Number(e.target.value) : null })
            }
          />
          <span className="text-slate-600">{t('profile.weight.hint')}</span>
        </label>
        <div className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
          {t('profile.activity')}
          <span className="text-slate-600">{t('profile.activity.hint')}</span>
          <div className="flex gap-2">
            {[
              ['sedentary', t('prof.sedentary')],
              ['moderate', t('prof.moderate')],
              ['active', t('prof.active')]
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => onSettings({ activity: k })}
                className={`flex-1 rounded-xl border px-2 py-2 text-sm transition ${
                  state.settings.activity === k
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-700 bg-slate-950 text-slate-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t('profile.ob')}>
        <p className="text-sm text-slate-200">
          {fmtNum(goal)} ml · {goalGlasses} {t('home.glassWord')}
        </p>
        {state.settings.weightKg ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {(() => {
              const b = goalBreakdown(state.settings.weightKg, state.settings.activity, new Date())
              return t('profile.ob.formula', {
                base: fmtNum(b.base),
                w: state.settings.weightKg,
                act: b.activityLabel.toLowerCase(),
                af: factor(b.activityFactor),
                sf: factor(b.seasonFactor),
                round: fmtNum(b.rounded),
                g: b.glasses
              })
            })()}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">{t('profile.ob.hintWeight')}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">{t('profile.ob.balance')}</p>
      </Section>

      <Section title={t('profile.glass')}>
        <div className="flex gap-2">
          {[200, 250, 330, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => onUpdate({ glassMl: ml })}
              className={`flex-1 rounded-xl border px-2 py-2 text-sm transition ${
                state.glassMl === ml
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700 bg-slate-950 text-slate-300'
              }`}
            >
              {ml} ml
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{t('profile.glass.hint')}</p>
      </Section>

      <Section title={t('profile.rem')}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-200">{t('profile.remind')}</p>
              <p className="text-xs text-slate-500">{permLabel}</p>
            </div>
            <Toggle
              label={t('profile.enable')}
              on={state.settings.enabled}
              onChange={(on) =>
                on && perm !== 'granted' ? enableNotifications() : onSettings({ enabled: on })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-200">{t('prof.autoInterval')}</p>
              <p className="text-xs text-slate-500">{t('prof.autoInterval.hint')}</p>
            </div>
            <Toggle
              label={t('prof.autoInterval.toggle')}
              on={state.settings.autoInterval}
              onChange={(on) => onSettings({ autoInterval: on })}
            />
          </div>

          <label className={`flex flex-col gap-1 text-xs text-slate-400 ${state.settings.autoInterval ? 'opacity-50' : ''}`}>
            {state.settings.autoInterval
              ? t('prof.every.auto', { n: state.settings.intervalMin })
              : t('prof.every', { n: state.settings.intervalMin })}
            <input
              type="range"
              min="30"
              max="240"
              step="30"
              value={state.settings.intervalMin}
              disabled={state.settings.autoInterval}
              onChange={(e) => onSettings({ intervalMin: Number(e.target.value) })}
              className="accent-cyan-400"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-200">{t('prof.when')}</p>
              <p className="text-xs text-slate-500">
                {state.settings.autoWindow
                  ? t('prof.when.auto.on', {
                      s: hh(state.settings.startHour),
                      e: hh(state.settings.endHour)
                    })
                  : t('prof.when.manual')}
              </p>
            </div>
            <Toggle
              label={t('prof.when.toggle')}
              on={state.settings.autoWindow}
              onChange={(on) => onSettings({ autoWindow: on })}
            />
          </div>

          <div
            className={`flex gap-3 ${state.settings.autoWindow ? 'pointer-events-none opacity-50' : ''}`}
          >
            <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
              {t('prof.from')}
              <input
                className={inputCls}
                type="time"
                value={hh(state.settings.startHour)}
                onChange={(e) =>
                  onSettings({ startHour: Number(e.target.value.split(':')[0]), autoWindow: false })
                }
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
              {t('prof.to')}
              <input
                className={inputCls}
                type="time"
                value={hh(state.settings.endHour)}
                onChange={(e) =>
                  onSettings({ endHour: Number(e.target.value.split(':')[0]), autoWindow: false })
                }
              />
            </label>
          </div>

          <ul className="flex flex-col gap-1 text-xs text-slate-500">
            <li>{t('prof.b.named')}</li>
            <li>{t('prof.b.stop')}</li>
            <li>{t('prof.b.sip')}</li>
            <li>{t('prof.b.sound')}</li>
            <li>{t('prof.b.desktop')}</li>
            <li>{t('prof.b.tap')}</li>
          </ul>
        </div>
      </Section>

      <Section title={t('profile.lang')}>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ lang: 'it' })}
            className={`flex-1 rounded-xl border px-2 py-2 text-sm transition ${
              state.lang !== 'en'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            Italiano
          </button>
          <button
            onClick={() => onUpdate({ lang: 'en' })}
            className={`flex-1 rounded-xl border px-2 py-2 text-sm transition ${
              state.lang === 'en'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            English
          </button>
        </div>
      </Section>

      <Section title={t('profile.data')}>
        <button
          onClick={() => {
            if (window.confirm(t('profile.reset.confirm'))) onReset()
          }}
          className="w-full rounded-xl border border-red-900/60 bg-red-950/40 py-2.5 text-sm text-red-300 transition hover:border-red-700"
        >
          {t('profile.reset')}
        </button>
      </Section>

      <p className="pb-2 text-center text-xs text-slate-600">{t('profile.footer', { v: __APP_VERSION__ })}</p>
    </div>
  )
}