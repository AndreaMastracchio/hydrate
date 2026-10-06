import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState, resetState, DEFAULTS } from './lib/storage.js'
import {
  addEntry,
  removeLastEntryOfDay,
  dayKey,
  totalForDay,
  currentStreak,
  computeGoal
} from './lib/hydrate.js'
import { startReminders, cancelReminders, snoozeReminder } from './lib/notify.js'
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
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => saveState(state), [state])

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

  const logGlass = useCallback(() => {
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
    startReminders(getConfig)
    return cancelReminders
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
      const start = new Date(now)
      start.setHours(s.settings.startHour, 0, 0, 0)
      const end = new Date(now)
      end.setHours(s.settings.endHour, 0, 0, 0)
      let time
      if (now < start) time = `La giornata riparte alle ${s.settings.startHour}:00`
      else if (now >= end) time = `Giornata chiusa: riparte alle ${s.settings.startHour}:00`
      else {
        const h = Math.max(1, Math.round((end - now) / 3600000))
        time = `Restano ${h}h alla giornata (fino alle ${s.settings.endHour}:00)`
      }
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('tray_update', {
        title: `${done}/${goalG}`,
        today: `Oggi ${done}/${goalG} bicchieri · mancano ${mlLeft} ml`,
        time
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

  const logDrink = (ml) => setState((s) => addEntry(s, { ts: Date.now(), ml }))
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
