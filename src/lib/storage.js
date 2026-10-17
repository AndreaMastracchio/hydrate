const KEY = 'hydrate:v1'

export const DEFAULTS = {
  name: '',
  lang: 'it',
  glassMl: 250,
  entries: [],
  settings: {
    enabled: false,
    intervalMin: 60,
    startHour: 9,
    endHour: 22,
    autoWindow: true,
    autoInterval: true,
    lastAdjusted: '',
    weightKg: null,
    activity: 'moderate',
    habits: null
  }
}

const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__

const invoke = (cmd, args) =>
  import('@tauri-apps/api/core').then(({ invoke }) => invoke(cmd, args))

export function freshState() {
  return { ...DEFAULTS, entries: [], settings: { ...DEFAULTS.settings } }
}

function merge(parsed) {
  return {
    ...DEFAULTS,
    ...parsed,
    entries: Array.isArray(parsed?.entries) ? parsed.entries : [],
    settings: { ...DEFAULTS.settings, ...(parsed?.settings || {}) }
  }
}

function readLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function loadState() {
  const parsed = readLocal()
  return parsed ? merge(parsed) : freshState()
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

export function resetState() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}

// Su desktop Rust è la fonte di verità (il webview può essere sospeso):
// localStorage resta lo store della PWA e un mirror qui.
export async function reloadStateAsync() {
  if (!isTauri()) return loadState()
  try {
    return merge(await invoke('state_load'))
  } catch {
    return loadState()
  }
}

export async function loadStateAsync() {
  if (!isTauri()) return loadState()
  try {
    const isDefault = await invoke('state_is_default')
    const local = readLocal()
    if (isDefault && local) {
      const migrated = merge(local)
      await invoke('state_save', { state: migrated })
      return migrated
    }
    return merge(await invoke('state_load'))
  } catch {
    return loadState()
  }
}

export async function saveStateAsync(state) {
  saveState(state)
  if (!isTauri()) return
  try {
    await invoke('state_save', { state })
  } catch {}
}

export async function resetStateAsync() {
  resetState()
  if (!isTauri()) return freshState()
  try {
    return merge(await invoke('state_reset'))
  } catch {
    return freshState()
  }
}
