import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState, freshState, resetState } from './lib/storage.js'
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
  const goal = useMemo(() => goalMlFor(state), [state])
  const streak = currentStreak(state.entries, goal)
  const goalGlasses = Math.max(1, Math.ceil(goal / glass))
  const glassesToday = Math.floor(totalToday / glass)
  const nowMs = clock
  const nextLabel = useMemo(() => {
    const ms = nextReminderIn(nowMs)
    return ms == null ? null : fmtCountdown(ms)
  }, [nowMs])

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
    const onFire = () => {
      setDue(true)
    }
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

  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return undefined
    let dead = false
    let unlisten = () => {}
    const pushTray = async (s) => {
      const now = new Date()
      const goalMl = goalMlFor(s, now)
      const total = totalForDay(s.entries, dayKey(now))
      const mlLeft = Math.max(0, goalMl - total)
      const pct = Math.min(100, Math.round((total / goalMl) * 100))
      const completato = total >= goalMl
      const nextIn = nextReminderIn(now.getTime())
      const later = completato
        ? ''
        : dueRef.current
          ? '⏳ adesso'
          : nextIn == null
            ? ''
            : `⏳ ${fmtCountdown(nextIn)}`
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
        : `${later} ${pct}%`.trim()
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
      .then(async ({ listen }) => {
        const off = await Promise.all([
          listen('tray:drink', () => logGlass())
        ])
        if (dead) off.forEach((fn) => fn())
        else unlisten = () => off.forEach((fn) => fn())
      })
      .catch(() => {})
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
