import { nextReminderDelay } from './hydrate.js'
import { t } from './i18n.js'

const RECHECK_MS = 30 * 60 * 1000
const SNOOZE_MIN = 15

let timer = null
let lastReminderTs = 0
let currentGetConfig = null
let currentOnFire = null
let tauriGranted = false
let notifyState = 'off'
let lastError = ''

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
      // su macOS il plugin risponde null quando non è ancora stato garantito
      // esplicitamente: in quel caso le notifiche native partono comunque,
      // quindi lo trattiamo come concesso. Solo un "denied" esplicito le blocca.
      tauriGranted = (await isPermissionGranted()) !== false
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
    if ((await isPermissionGranted()) !== false) {
      tauriGranted = true
      return 'granted'
    }
    const result = await request()
    tauriGranted = result !== 'denied'
    return result
  }
  if (!notificationsSupported()) return 'unsupported'
  return Notification.requestPermission()
}

export function reminderOptions() {
  return {
    body: t('notify.browser.body'),
    silent: true,
    tag: 'hydrate-reminder',
    data: { source: 'hydrate' },
    actions: [
      { action: 'log', title: t('notify.browser.log') },
      { action: 'later', title: t('notify.browser.later') }
    ]
  }
}

export function snoozeReminder() {
  if (!currentGetConfig) return
  const cfg = currentGetConfig()
  lastReminderTs = Date.now() - Math.max(0, cfg.intervalMin - SNOOZE_MIN) * 60000
  startReminders(currentGetConfig, { onFire: currentOnFire })
}

function permissionGranted() {
  if (isTauri()) return tauriGranted
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

function fire() {
  currentOnFire?.()
  if (isTauri()) {
    notifyState = 'sending'
    const name = currentGetConfig?.().name?.trim() || ''
    const title = name ? t('notify.title.named', { name }) : t('notify.title.default')
    const body = name ? t('notify.body.named') : t('notify.body.plain')
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('native_notify', { title, body }))
      .then(() => {
        notifyState = 'ok'
      })
      .catch((e) => {
        notifyState = 'error'
        lastError = String(e)
        console.error('Hydrate: notifica non riuscita', e)
      })
    return
  }
  const name = currentGetConfig?.().name?.trim() || ''
  const n = new Notification(name ? t('notify.title.named', { name }) : t('notify.title.default'), reminderOptions())
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

export function notifyStatusText() {
  if (notifyState === 'ok') return t('notify.ok')
  if (notifyState === 'sending') return '…'
  if (notifyState === 'error') return `✗ ${lastError}`
  return t('notify.off')
}

export function startReminders(getConfig, options = {}) {
  cancelReminders()
  currentOnFire = options.onFire || null
  if (isTauri()) {
    syncPermission().then((p) => {
      if (p === 'granted') scheduleTick(getConfig)
      else console.warn('Hydrate: notifiche bloccate', p)
    })
    return
  }
  scheduleTick(getConfig)
}
