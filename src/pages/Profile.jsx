import { useEffect, useState } from 'react'
import { getPermission, requestPermission, syncPermission } from '../lib/notify.js'

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
    granted: 'Notifiche autorizzate',
    denied: 'Notifiche bloccate dalle impostazioni del browser',
    default: 'Notifiche non ancora autorizzate',
    unsupported: 'Questo browser non supporta le notifiche'
  }[perm]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">Profilo</h1>
        <p className="text-xs text-slate-500">Tutto locale: nessun account, nessuna nube</p>
      </header>

      <Section title="Tu">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Nome
          <input
            className={inputCls}
            value={state.name}
            placeholder="Il tuo nome"
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </label>
        <label className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
          Peso in kg (per stimare quanta acqua serve a te)
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
        </label>
        <div className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
          Quanto ti muovi
          <div className="flex gap-2">
            {[
              ['sedentary', 'Sedentario'],
              ['moderate', 'Moderato'],
              ['active', 'Sportivo']
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

      <Section title="Obiettivo automatico">
        <p className="text-sm text-slate-200">
          {goal} ml · {goalGlasses} bicchieri
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Non te lo chiediamo: lo calcoliamo noi dal tuo peso, dalla tua attività, dalla stagione e
          dalla media degli ultimi 7 giorni in cui hai bevuto (mai sotto 1.500, mai sopra 4.000 ml).
        </p>
      </Section>

      <Section title="Il tuo bicchiere">
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
        <p className="mt-2 text-xs text-slate-500">
          Quanto ci metti nel tuo bicchiere? È il modo in cui contiamo: «un bicchiere».
        </p>
      </Section>

      <Section title="Promemoria">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-200">Ricordami di bere</p>
              <p className="text-xs text-slate-500">{permLabel}</p>
            </div>
            <Toggle
              label="Attiva i promemoria"
              on={state.settings.enabled}
              onChange={(on) => (on && perm !== 'granted' ? enableNotifications() : onSettings({ enabled: on }))}
            />
          </div>

          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Ogni {state.settings.intervalMin} minuti
            <input
              type="range"
              min="30"
              max="240"
              step="30"
              value={state.settings.intervalMin}
              onChange={(e) => onSettings({ intervalMin: Number(e.target.value) })}
              className="accent-cyan-400"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
              Dalle
              <input
                className={inputCls}
                type="time"
                value={`${String(state.settings.startHour).padStart(2, '0')}:00`}
                onChange={(e) => onSettings({ startHour: Number(e.target.value.split(':')[0]) })}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
              Alle
              <input
                className={inputCls}
                type="time"
                value={`${String(state.settings.endHour).padStart(2, '0')}:00`}
                onChange={(e) => onSettings({ endHour: Number(e.target.value.split(':')[0]) })}
              />
            </label>
          </div>

          <ul className="flex flex-col gap-1 text-xs text-slate-500">
            <li>• Si fermano appena raggiungi il goal.</li>
            <li>• L’intervallo riparte dall’ultimo sorso, non da orari fissi.</li>
            <li>• Con suono discreto, mai di notte, mai pubblicità.</li>
            <li>• Con l’app desktop girano anche con la finestra chiusa: l’app vive nel menu in alto.</li>
            <li>• La risposta a «bevi» è un tap su «Bevi un bicchiere 💧» nel menu in alto.</li>
          </ul>
        </div>
      </Section>

      <Section title="Dati">
        <button
          onClick={() => {
            if (window.confirm('Cancellare tutti i dati? Non si può tornare indietro.')) onReset()
          }}
          className="w-full rounded-xl border border-red-900/60 bg-red-950/40 py-2.5 text-sm text-red-300 transition hover:border-red-700"
        >
          Cancella tutti i dati
        </button>
      </Section>

      <p className="pb-2 text-center text-xs text-slate-600">
        Hydrate v0.1.0 — gratis, senza account, senza ads.
      </p>
    </div>
  )
}
