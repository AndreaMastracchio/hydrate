import { nextReminderDelay } from './hydrate.js'
import { t } from './i18n.js'

const RECHECK_MS = 30 * 60 * 1000
const SNOOZE_MIN = 15

let timer = null
let lastReminderTs = 0
let currentGetConfig = null
let currentOnFire = null
let tauriGranted = false
let nextReminderAt = null

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

function reminderTexts() {
  const name = currentGetConfig?.().name?.trim() || ''
  return {
    title: name ? t('notify.title.named', { name }) : t('notify.title.default'),
    body: name ? t('notify.body.named') : t('notify.body.plain')
  }
}

function fire() {
  currentOnFire?.()
  const { title } = reminderTexts()
  const n = new Notification(title, reminderOptions())
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
  nextReminderAt = null
  const cfg = getConfig()
  if (!cfg.enabled || !permissionGranted()) return
  const delay = nextReminderDelay({ ...cfg, lastReminderTs }, new Date())
  if (delay == null) {
    timer = setTimeout(() => scheduleTick(getConfig), RECHECK_MS)
    return
  }
  nextReminderAt = Date.now() + delay
  timer = setTimeout(() => {
    nextReminderAt = null
    lastReminderTs = Date.now()
    if (permissionGranted()) fire()
    scheduleTick(getConfig)
  }, delay)
}

export function nextReminderIn(now = Date.now()) {
  return nextReminderAt == null ? null : Math.max(0, nextReminderAt - now)
}

export function notifyStatusText() {
  // Su desktop il promemoria lo manda Rust: qui riportiamo solo se le
  // notifiche sono permesse (il webview può essere sospeso, issue #16).
  if (isTauri()) return tauriGranted ? t('notify.ok') : t('notify.off')
  return t('notify.off')
}

export function startReminders(getConfig, options = {}) {
  cancelReminders()
  currentOnFire = options.onFire || null
  if (isTauri()) {
    // Lo scheduler vive in Rust (issue #16): qui sincronizziamo solo il
    // permesso, che serve al testo «Notifiche: …» nel menu.
    syncPermission()
    return
  }
  scheduleTick(getConfig)
}
