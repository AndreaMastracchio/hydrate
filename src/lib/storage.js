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
    activity: 'moderate'
  }
}

export function freshState() {
  return { ...DEFAULTS, entries: [], settings: { ...DEFAULTS.settings } }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) }
    }
  } catch {
    return freshState()
  }
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
