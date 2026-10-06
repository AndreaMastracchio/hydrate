const KEY = 'hydrate:v1'

export const DEFAULTS = {
  name: '',
  glassMl: 250,
  entries: [],
  settings: { enabled: false, intervalMin: 120, startHour: 9, endHour: 22, weightKg: null, activity: 'moderate' }
}

export function loadState() {
  const fresh = () => ({ ...DEFAULTS, entries: [], settings: { ...DEFAULTS.settings } })
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) }
    }
  } catch {
    return fresh()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage pieno o indisponibile: l'app resta usabile in sessione
  }
}

export function resetState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // niente da fare
  }
}
