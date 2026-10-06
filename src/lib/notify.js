import { nextReminderDelay } from './hydrate.js'

const RECHECK_MS = 30 * 60 * 1000
const SNOOZE_MIN = 15

let timer = null
let lastReminderTs = 0
let currentGetConfig = null
let tauriGranted = false

const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__

export function cancelReminders() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

export function notificationsSupported() {
  return isTauri() || (typeof window !== 'undefined' && 'Notification' in window)
}

export function getPermission() {
  if (isTauri()) return tauriGranted ? 'granted' : 'default'
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function syncPermission() {
  if (isTauri()) {
    try {
      const { isPermissionGranted } = await import('@tauri-apps/plugin-notification')
      tauriGranted = await isPermissionGranted()
    } catch {
      tauriGranted = false
    }
  }
  return getPermission()
}

export async function requestPermission() {
  if (isTauri()) {
    const { isPermissionGranted, requestPermission: request } = await import(
      '@tauri-apps/plugin-notification'
    )
    if (await isPermissionGranted()) {
      tauriGranted = true
      return 'granted'
    }
    const result = await request()
    tauriGranted = result === 'granted'
    return result
  }
  if (!notificationsSupported()) return 'unsupported'
  return Notification.requestPermission()
}

export function reminderOptions() {
  return {
    body: 'È l’ora di un bicchiere 💧 Tocca «Ho bevuto» quando lo hai bevuto.',
    silent: true,
    tag: 'hydrate-reminder',
    data: { source: 'hydrate' },
    actions: [
      { action: 'log', title: 'Ho bevuto' },
      { action: 'later', title: 'Più tardi' }
    ]
  }
}

export function snoozeReminder() {
  if (!currentGetConfig) return
  const cfg = currentGetConfig()
  lastReminderTs = Date.now() - Math.max(0, (cfg.intervalMin - SNOOZE_MIN)) * 60000
  startReminders(currentGetConfig)
}

function permissionGranted() {
  if (isTauri()) return tauriGranted
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

function fire() {
  if (isTauri()) {
    import('@tauri-apps/plugin-notification')
      .then(({ sendNotification }) =>
        sendNotification({
          title: 'Hydrate',
          body: 'È l’ora di un bicchiere 💧 Tocca «Bevi un bicchiere» nel menu in alto.',
          sound: 'Ping'
        })
      )
      .catch(() => {})
    return
  }
  const n = new Notification('Hydrate', reminderOptions())
  n.onclick = () => {
    window.focus()
    n.close()
  }
  n.onaction = (e) => {
    if (e.action === 'log') window.dispatchEvent(new Event('hydrate:log-request'))
    else if (e.action === 'later') window.dispatchEvent(new Event('hydrate:snooze-request'))
    n.close()
  }
}

function scheduleTick(getConfig) {
  cancelReminders()
  currentGetConfig = getConfig
  const cfg = getConfig()
  if (!cfg.enabled || !permissionGranted()) return
  const delay = nextReminderDelay({ ...cfg, lastReminderTs }, new Date())
  if (delay == null) {
    timer = setTimeout(() => scheduleTick(getConfig), RECHECK_MS)
    return
  }
  timer = setTimeout(() => {
    lastReminderTs = Date.now()
    if (permissionGranted()) fire()
    scheduleTick(getConfig)
  }, delay)
}

export function startReminders(getConfig) {
  cancelReminders()
  if (isTauri()) {
    syncPermission().then((p) => {
      if (p === 'granted') scheduleTick(getConfig)
    })
    return
  }
  scheduleTick(getConfig)
}
