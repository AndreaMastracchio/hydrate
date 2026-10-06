const DAY_MS = 86400000

export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const toDate = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const shiftDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY_MS)

export function addEntry(state, e) {
  return { ...state, entries: [...state.entries, e] }
}

export function removeLastEntryOfDay(state, key) {
  const entries = [...state.entries]
  for (let i = entries.length - 1; i >= 0; i--) {
    if (dayKey(new Date(entries[i].ts)) === key) {
      entries.splice(i, 1)
      return { ...state, entries }
    }
  }
  return state
}

export function dailyTotals(entries) {
  const map = new Map()
  for (const e of entries) {
    const k = dayKey(new Date(e.ts))
    map.set(k, (map.get(k) || 0) + e.ml)
  }
  return map
}

export function totalForDay(entries, key) {
  let t = 0
  for (const e of entries) {
    if (dayKey(new Date(e.ts)) === key) t += e.ml
  }
  return t
}

export function progressPct(total, goal) {
  if (!(goal > 0)) return 0
  return Math.min(100, (total / goal) * 100)
}

export function isGoalMet(total, goal) {
  return goal > 0 && total >= goal
}

export function lastNDayKeys(n, today = new Date()) {
  if (!(n > 0)) return []
  const keys = []
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dayKey(shiftDays(today, -i)))
  }
  return keys
}

export function currentStreak(entries, goal, today = new Date()) {
  if (!(goal > 0)) return 0
  const totals = dailyTotals(entries)
  const met = (key) => (totals.get(key) || 0) >= goal
  let cursor = dayKey(today)
  if (!met(cursor)) {
    cursor = dayKey(shiftDays(today, -1))
    if (!met(cursor)) return 0
  }
  let count = 0
  let d = toDate(cursor)
  while (met(dayKey(d))) {
    count++
    d = shiftDays(d, -1)
  }
  return count
}

export function bestStreak(entries, goal, today = new Date()) {
  if (!(goal > 0)) return 0
  const totals = dailyTotals(entries)
  const todayK = dayKey(today)
  const keys = [...totals.keys()].filter((k) => k <= todayK).sort()
  let best = 0
  let run = 0
  let prev = null
  for (const key of keys) {
    if ((totals.get(key) || 0) < goal) {
      run = 0
      prev = null
      continue
    }
    run = prev && diffDays(prev, key) === 1 ? run + 1 : 1
    prev = key
    if (run > best) best = run
  }
  return best
}

export function completionRate(entries, goal, n, today = new Date()) {
  if (!(n > 0) || !(goal > 0)) return 0
  const totals = dailyTotals(entries)
  const met = lastNDayKeys(n, today).filter((k) => (totals.get(k) || 0) >= goal).length
  return met / n
}

export function weeklyBars(entries, goal, n, today = new Date()) {
  const totals = dailyTotals(entries)
  return lastNDayKeys(n, today).map((k) => {
    const total = totals.get(k) || 0
    return { key: k, total, met: isGoalMet(total, goal) }
  })
}

const ACTIVITY_FACTOR = { sedentary: 1, moderate: 1.1, active: 1.25 }
const seasonFactor = (month) => (month >= 4 && month <= 8 ? 1.06 : month === 3 || month === 9 ? 1.03 : 1)

export function individualMl(weightKg, activity, date) {
  return weightKg * 33 * (ACTIVITY_FACTOR[activity] ?? 1.1) * seasonFactor(date.getMonth())
}

export function computeGoal(entries, today = new Date(), opts = {}) {
  const {
    fallback = 2000,
    min = 1500,
    max = 4000,
    sampleDays = 7,
    minDays = 3,
    weightKg = null,
    activity = 'moderate'
  } = opts
  const todayK = dayKey(today)
  const values = [...dailyTotals(entries).entries()]
    .filter(([k, v]) => k <= todayK && v > 0)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, sampleDays)
    .map(([, v]) => v)
  const history = values.length >= minDays ? values.reduce((s, v) => s + v, 0) / values.length : null
  const formula = weightKg > 0 ? individualMl(weightKg, activity, today) : null
  let base
  if (history != null && formula != null) base = (history + formula) / 2
  else if (history != null) base = history
  else if (formula != null) base = formula
  else return fallback
  return Math.min(max, Math.max(min, Math.round(base / 50) * 50))
}

const startOfDayHour = (d, h) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0, 0, 0).getTime()

export function nextReminderDelay(cfg, now = new Date()) {
  const { enabled, intervalMin, startHour, endHour, lastLogTs = 0, lastReminderTs = 0, goalMet = false } = cfg || {}
  if (!enabled || goalMet || !(intervalMin > 0)) return null
  const nowMs = now.getTime()
  const anchor = Math.min(Math.max(lastLogTs, lastReminderTs), nowMs)
  let target
  if (anchor > 0) {
    target = anchor + intervalMin * 60000
    if (target <= nowMs) target = nowMs
  } else {
    target = Math.max(startOfDayHour(now, startHour), nowMs)
  }
  const t = new Date(target)
  if (t.getHours() < startHour) {
    target = startOfDayHour(now, startHour)
  } else if (t.getHours() >= endHour) {
    target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, startHour, 0, 0, 0).getTime()
  }
  return Math.max(0, target - nowMs)
}
