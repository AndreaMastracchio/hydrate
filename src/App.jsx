import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  loadState,
  loadStateAsync,
  reloadStateAsync,
  saveStateAsync,
  resetStateAsync,
  freshState
} from './lib/storage.js'
import { addEntry, removeLastEntryOfDay, dayKey, totalForDay, currentStreak, computeGoal, activeWindow, adaptedInterval } from './lib/hydrate.js'
import { t, setLocale, fmtCountdown } from './lib/i18n.js'
import {
  startReminders,
  cancelReminders,
  snoozeReminder,
  syncPermission,
  notifyStatusText,
  nextReminderIn
} from './lib/notify.js'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'
import Stats from './pages/Stats.jsx'
import Profile from './pages/Profile.jsx'

const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
const invoke = (cmd, args) =>
  import('@tauri-apps/api/core').then(({ invoke }) => invoke(cmd, args))

const glassOf = (s) => (s.glassMl > 0 ? s.glassMl : 250)
const snapToGlass = (ml, glass) => Math.ceil(ml / glass) * glass
const goalMlFor = (s, now = new Date()) =>
  snapToGlass(
    computeGoal(s.entries, now, {
      weightKg: s.settings.weightKg,
      activity: s.settings.activity
    }),
    glassOf(s)
  )

export default function App() {
  const [tab, setTab] = useState('home')
  const [state, setState] = useState(loadState)
  const [loaded, setLoaded] = useState(false)
  const [due, setDue] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const [nextAt, setNextAt] = useState(null)
  const stateRef = useRef(state)
  const dueRef = useRef(due)
  stateRef.current = state
  dueRef.current = due

  setLocale(state.lang)

  // Su desktop lo stato vero è in Rust: lo carichiamo subito sopra il mirror
  // di localStorage (migrazione una-tantum inclusa, storage.js).
  useEffect(() => {
    let dead = false
    loadStateAsync().then((s) => {
      if (!dead) {
        setState(s)
        setLoaded(true)
      }
    })
    return () => {
      dead = true
    }
  }, [])

  // Si salva solo DOPO che lo stato vero (Rust) è stato caricato: altrimenti il
  // mirror locale, ancora stantio, sovrascriverebbe lo store all'avvio.
  useEffect(() => {
    if (!loaded) return
    saveStateAsync(state)
  }, [state, loaded])

  useEffect(() => {
    const iv = setInterval(() => setClock(Date.now()), 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!state.settings.autoWindow) return undefined
    setState((s) => {
      if (!s.settings.autoWindow) return s
      const w = activeWindow(s.entries, new Date(), { startHour: 9, endHour: 22 })
      if (w.startHour === s.settings.startHour && w.endHour === s.settings.endHour) return s
      return { ...s, settings: { ...s.settings, ...w } }
    })
  }, [state.entries, state.settings.autoWindow, state.settings.startHour, state.settings.endHour])

  const todayKey = dayKey(new Date())
  const totalToday = totalForDay(state.entries, todayKey)
  const glass = glassOf(state)
  const goal = useMemo(() => goalMlFor(state), [state])
  const streak = currentStreak(state.entries, goal)
  const goalGlasses = Math.max(1, Math.ceil(goal / glass))
  const glassesToday = Math.floor(totalToday / glass)
  const nowMs = clock
  const nextLabel = useMemo(() => {
    if (isTauri()) {
      if (nextAt == null) return null
      return fmtCountdown(Math.max(0, nextAt - nowMs))
    }
    const ms = nextReminderIn(nowMs)
    return ms == null ? null : fmtCountdown(ms)
  }, [nowMs, nextAt])

  useEffect(() => {
    if (!state.settings.autoInterval) return undefined
    const tk = dayKey(new Date())
    if (state.settings.lastAdjusted === tk) return undefined
    setState((s) => {
      if (!s.settings.autoInterval) return s
      const adjusted = adaptedInterval(s.settings.intervalMin, s.entries, goal, new Date())
      if (adjusted === s.settings.intervalMin && s.settings.lastAdjusted === tk) return s
      return { ...s, settings: { ...s.settings, intervalMin: adjusted, lastAdjusted: tk } }
    })
  }, [state.entries, goal, state.settings.autoInterval, state.settings.intervalMin, state.settings.lastAdjusted])

  const logGlass = useCallback(() => {
    setDue(false)
    setState((s) => addEntry(s, { ts: Date.now(), ml: glassOf(s) }))
  }, [])

  useEffect(() => {
    const getConfig = () => {
      const s = stateRef.current
      let lastLogTs = 0
      for (const e of s.entries) if (e.ts > lastLogTs) lastLogTs = e.ts
      const todayTotal = totalForDay(s.entries, dayKey(new Date()))
      const goalMl = goalMlFor(s)
      return { ...s.settings, lastLogTs, goalMet: todayTotal >= goalMl }
    }
    const onFire = () => setDue(true)
    startReminders(getConfig, { onFire })
    const iv = setInterval(() => startReminders(getConfig, { onFire }), 60000)
    return () => {
      cancelReminders()
      clearInterval(iv)
    }
  }, [state])

  useEffect(() => {
    const onLog = () => logGlass()
    const onSnooze = () => snoozeReminder()
    const onSwMessage = (e) => {
      const d = e.data
      if (d?.source !== 'hydrate') return
      if (d.action === 'log') logGlass()
      else if (d.action === 'later') onSnooze()
    }
    window.addEventListener('hydrate:log-request', onLog)
    window.addEventListener('hydrate:snooze-request', onSnooze)
    navigator.serviceWorker?.addEventListener('message', onSwMessage)
    return () => {
      window.removeEventListener('hydrate:log-request', onLog)
      window.removeEventListener('hydrate:snooze-request', onSnooze)
      navigator.serviceWorker?.removeEventListener('message', onSwMessage)
    }
  }, [logGlass])

  // Desktop: Rust manda promemoria e tick anche col webview sospeso. Qui
  // aggiorniamo il testo notifiche del menu e rileggiamo lo stato quando
  // un'azione nativa (menu o finestrella) scrive al posto nostro.
  useEffect(() => {
    if (!isTauri()) return undefined
    let dead = false
    let unlisten = () => {}

    const push = async () => {
      try {
        await syncPermission()
        await invoke('tray_update', { notify: t('tray.notif', { s: notifyStatusText() }) })
      } catch {}
    }
    const syncNextAt = async () => {
      try {
        const at = await invoke('schedule_next_at')
        if (!dead) setNextAt(at)
      } catch {}
    }
    const refresh = () => {
      setDue(false)
      reloadStateAsync().then((s) => {
        if (!dead) setState(s)
      })
    }

    push()
    syncNextAt()
    const iv = setInterval(() => {
      push()
      syncNextAt()
    }, 30000)
    const listenAll = () =>
      import('@tauri-apps/api/event').then(({ listen }) =>
        Promise.all([
          listen('reminder:due', () => {
            setDue(true)
            syncNextAt()
          }),
          listen('tray:drink', refresh),
          listen('mini:drink', refresh),
          listen('tray:later', refresh)
        ])
      )
    listenAll()
      .then((off) => {
        if (dead) off.forEach((fn) => fn())
        else unlisten = () => off.forEach((fn) => fn())
      })
      .catch(() => {})
    return () => {
      dead = true
      unlisten()
      clearInterval(iv)
    }
  }, [])

  // Il goal calcolato dal JS guida la barra del menu: spinto a Rust quando cambia.
  useEffect(() => {
    if (!isTauri() || !(goal > 0)) return
    invoke('schedule_sync_goal', { goalMl: goal }).catch(() => {})
  }, [goal])

  const logDrink = (ml) => {
    setDue(false)
    setState((s) => addEntry(s, { ts: Date.now(), ml }))
  }
  const undoLast = () => setState((s) => removeLastEntryOfDay(s, dayKey(new Date())))
  const update = (patch) => setState((s) => ({ ...s, ...patch }))
  const updateSettings = (patch) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  const reset = async () => {
    const fresh = await resetStateAsync()
    setState(fresh || freshState())
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 px-5 pt-6 pb-28">
        {tab === 'home' && (
          <Home
            state={state}
            totalToday={totalToday}
            goal={goal}
            goalGlasses={goalGlasses}
            glassesToday={glassesToday}
            streak={streak}
            due={due}
            nextLabel={nextLabel}
            onLog={logDrink}
            onUndo={undoLast}
          />
        )}
        {tab === 'stats' && <Stats state={state} goal={goal} goalGlasses={goalGlasses} />}
        {tab === 'profile' && (
          <Profile
            state={state}
            goal={goal}
            goalGlasses={goalGlasses}
            onUpdate={update}
            onSettings={updateSettings}
            onReset={reset}
          />
        )}
      </main>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}
