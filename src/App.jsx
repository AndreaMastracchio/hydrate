import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState, resetState, DEFAULTS } from './lib/storage.js'
import { addEntry, removeLastEntryOfDay, dayKey, totalForDay, currentStreak, computeGoal, activeWindow, adaptedInterval } from './lib/hydrate.js'
import { t, setLocale, fmtCountdown } from './lib/i18n.js'
import {
  startReminders,
  cancelReminders,
  snoozeReminder,
  notifyStatusText,
  nextReminderIn
} from './lib/notify.js'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'
import Stats from './pages/Stats.jsx'
import Profile from './pages/Profile.jsx'

const freshState = () => ({ ...DEFAULTS, entries: [], settings: { ...DEFAULTS.settings } })

const glassOf = (s) => (s.glassMl > 0 ? s.glassMl : 250)
const snapToGlass = (ml, glass) => Math.ceil(ml / glass) * glass

export default function App() {
  const [tab, setTab] = useState('home')
  const [state, setState] = useState(loadState)
  const [due, setDue] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const stateRef = useRef(state)
  const dueRef = useRef(due)
  stateRef.current = state
  dueRef.current = due

  setLocale(state.lang)

  useEffect(() => saveState(state), [state])

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
  const goal = useMemo(
    () =>
      snapToGlass(
        computeGoal(state.entries, new Date(), {
          weightKg: state.settings.weightKg,
          activity: state.settings.activity
        }),
        glass
      ),
    [state.entries, glass, state.settings.weightKg, state.settings.activity]
  )
  const streak = currentStreak(state.entries, goal)
  const goalGlasses = Math.max(1, Math.ceil(goal / glass))
  const glassesToday = Math.floor(totalToday / glass)
  const nextLabel = useMemo(() => {
    const ms = nextReminderIn()
    return ms == null ? null : fmtCountdown(ms)
  }, [clock, due, state])

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
      const goalMl = snapToGlass(
        computeGoal(s.entries, new Date(), {
          weightKg: s.settings.weightKg,
          activity: s.settings.activity
        }),
        glassOf(s)
      )
      return { ...s.settings, lastLogTs, goalMet: todayTotal >= goalMl }
    }
    startReminders(getConfig, { onFire: () => setDue(true) })
    const iv = setInterval(() => startReminders(getConfig, { onFire: () => setDue(true) }), 60000)
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

  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return undefined
    let dead = false
    let unlisten = () => {}
    const pushTray = async (s) => {
      const now = new Date()
      const glass = glassOf(s)
      const goalMl = snapToGlass(
        computeGoal(s.entries, now, {
          weightKg: s.settings.weightKg,
          activity: s.settings.activity
        }),
        glass
      )
      const total = totalForDay(s.entries, dayKey(now))
      const goalG = Math.max(1, Math.ceil(goalMl / glass))
      const done = Math.min(goalG, Math.floor(total / glass))
      const mlLeft = Math.max(0, goalMl - total)
      const pct = Math.min(100, Math.round((total / goalMl) * 100))
      const completato = total >= goalMl
      const start = new Date(now)
      start.setHours(s.settings.startHour, 0, 0, 0)
      const end = new Date(now)
      end.setHours(s.settings.endHour, 0, 0, 0)
      let time
      if (now < start) time = t('tray.time.starts', { h: s.settings.startHour })
      else if (now >= end) time = t('tray.time.closed', { h: s.settings.startHour })
      else {
        const h = Math.max(1, Math.round((end - now) / 3600000))
        time = t('tray.time.left', { h, e: s.settings.endHour })
      }
      const title = completato
        ? t('tray.done')
        : dueRef.current
          ? `💧 ${pct}%`
          : `${pct}%`
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('tray_update', {
        title,
        today: completato ? t('tray.alldone') : t('tray.today', { p: pct, m: mlLeft }),
        time,
        notify: t('tray.notif', { s: notifyStatusText() }),
        drink: t('tray.drink') + (dueRef.current ? ` — ${t('tray.now')}` : '')
      })
    }
    Promise.resolve()
      .then(() => pushTray(stateRef.current))
      .catch(() => {})
    const iv = setInterval(() => pushTray(stateRef.current).catch(() => {}), 60000)
    import('@tauri-apps/api/event')
      .then(({ listen }) => listen('tray:drink', () => logGlass()))
      .then((fn) => (dead ? fn() : (unlisten = fn)))
    return () => {
      dead = true
      unlisten()
      clearInterval(iv)
    }
  }, [logGlass, state])

  const logDrink = (ml) => {
    setDue(false)
    setState((s) => addEntry(s, { ts: Date.now(), ml }))
  }
  const undoLast = () => setState((s) => removeLastEntryOfDay(s, dayKey(new Date())))
  const update = (patch) => setState((s) => ({ ...s, ...patch }))
  const updateSettings = (patch) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  const reset = () => {
    resetState()
    setState(freshState())
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
