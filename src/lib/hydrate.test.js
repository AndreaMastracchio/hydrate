import { describe, it, expect } from 'vitest'
import {
  dayKey,
  addEntry,
  totalForDay,
  progressPct,
  isGoalMet,
  dailyTotals,
  lastNDayKeys,
  currentStreak,
  bestStreak,
  completionRate,
  weeklyBars,
  nextReminderDelay,
  computeGoal,
  activeWindow,
  goalBreakdown,
  adaptedInterval
} from './hydrate.js'

const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min)
const entry = (date, ml) => ({ ts: date.getTime(), ml })

describe('dayKey', () => {
  it('formatta la data locale YYYY-MM-DD', () => {
    expect(dayKey(at(2026, 3, 5))).toBe('2026-03-05')
    expect(dayKey(at(2026, 12, 31))).toBe('2026-12-31')
    expect(dayKey(at(2026, 1, 2))).toBe('2026-01-02')
  })
})

describe('addEntry', () => {
  it('restituisce un nuovo stato con la voce aggiunta', () => {
    const s0 = { entries: [] }
    const s1 = addEntry(s0, entry(at(2026, 3, 5), 250))
    expect(s1.entries).toHaveLength(1)
    expect(s0.entries).toHaveLength(0)
    expect(s1.entries[0].ml).toBe(250)
  })
})

describe('totalForDay / dailyTotals', () => {
  it('somma solo le voci del giorno richiesto', () => {
    const e = [entry(at(2026, 3, 5, 9), 250), entry(at(2026, 3, 5, 15), 500), entry(at(2026, 3, 6, 9), 250)]
    expect(totalForDay(e, '2026-03-05')).toBe(750)
    expect(totalForDay(e, '2026-03-06')).toBe(250)
    expect(totalForDay(e, '2026-03-07')).toBe(0)
  })

  it('raggruppa per giorno', () => {
    const e = [entry(at(2026, 3, 5, 9), 250), entry(at(2026, 3, 5, 15), 500), entry(at(2026, 3, 6, 9), 250)]
    const t = dailyTotals(e)
    expect(t.get('2026-03-05')).toBe(750)
    expect(t.get('2026-03-06')).toBe(250)
    expect(t.size).toBe(2)
  })
})

describe('progressPct / isGoalMet', () => {
  it('calcola la percentuale con clamp 0..100', () => {
    expect(progressPct(0, 2000)).toBe(0)
    expect(progressPct(1000, 2000)).toBe(50)
    expect(progressPct(2500, 2000)).toBe(100)
  })
  it('goal non valido => 0 e non raggiunto', () => {
    expect(progressPct(500, 0)).toBe(0)
    expect(isGoalMet(500, 0)).toBe(false)
  })
  it('meta raggiunta solo con total >= goal', () => {
    expect(isGoalMet(1999, 2000)).toBe(false)
    expect(isGoalMet(2000, 2000)).toBe(true)
  })
})

describe('lastNDayKeys', () => {
  it('ultimi n giorni, dal più vecchio a oggi', () => {
    expect(lastNDayKeys(3, at(2026, 3, 5))).toEqual(['2026-03-03', '2026-03-04', '2026-03-05'])
  })
  it('attraversa il cambio di mese', () => {
    expect(lastNDayKeys(3, at(2026, 4, 1))).toEqual(['2026-03-30', '2026-03-31', '2026-04-01'])
  })
})

describe('currentStreak', () => {
  const goal = 2000
  it('vuoto => 0', () => {
    expect(currentStreak([], goal, at(2026, 3, 5))).toBe(0)
  })
  it('oggi non ancora raggiunto ma ieri sì => conta da ieri (grazia del mattino)', () => {
    const e = [entry(at(2026, 3, 4, 10), 2000), entry(at(2026, 3, 5, 8), 500)]
    expect(currentStreak(e, goal, at(2026, 3, 5))).toBe(1)
  })
  it('giorni consecutivi raggiunti', () => {
    const e = [entry(at(2026, 3, 3), 2000), entry(at(2026, 3, 4), 2100), entry(at(2026, 3, 5), 2000)]
    expect(currentStreak(e, goal, at(2026, 3, 5))).toBe(3)
  })
  it('una lacuna azzera', () => {
    const e = [entry(at(2026, 3, 2), 2000), entry(at(2026, 3, 4), 2000), entry(at(2026, 3, 5), 2000)]
    expect(currentStreak(e, goal, at(2026, 3, 5))).toBe(2)
  })
  it('oggi non raggiunto e ieri nemmeno => 0', () => {
    const e = [entry(at(2026, 3, 3), 2000), entry(at(2026, 3, 5), 500)]
    expect(currentStreak(e, goal, at(2026, 3, 5))).toBe(0)
  })
})

describe('bestStreak', () => {
  it('migliore serie di giorni consecutivi raggiunti', () => {
    const e = [
      entry(at(2026, 3, 1), 2000), entry(at(2026, 3, 2), 2000), entry(at(2026, 3, 3), 2000),
      entry(at(2026, 3, 4), 500),
      entry(at(2026, 3, 5), 2000), entry(at(2026, 3, 6), 2000)
    ]
    expect(bestStreak(e, 2000, at(2026, 3, 6))).toBe(3)
  })
  it('serie parziale oggi non conta se non raggiunto', () => {
    const e = [entry(at(2026, 3, 5), 500)]
    expect(bestStreak(e, 2000, at(2026, 3, 5))).toBe(0)
  })
})

describe('completionRate', () => {
  it('quota dei giorni raggiunti sugli ultimi n', () => {
    const e = [entry(at(2026, 3, 3), 2000), entry(at(2026, 3, 5), 2000)]
    expect(completionRate(e, 2000, 3, at(2026, 3, 5))).toBeCloseTo(2 / 3)
  })
  it('n non valido => 0', () => {
    expect(completionRate([], 2000, 0, at(2026, 3, 5))).toBe(0)
  })
})

describe('weeklyBars', () => {
  it('barre per gli ultimi n giorni con totale e flag obiettivo', () => {
    const e = [entry(at(2026, 3, 4), 2500), entry(at(2026, 3, 5), 1000)]
    const bars = weeklyBars(e, 2000, 3, at(2026, 3, 5))
    expect(bars).toHaveLength(3)
    expect(bars[1]).toEqual({ key: '2026-03-04', total: 2500, met: true })
    expect(bars[2]).toEqual({ key: '2026-03-05', total: 1000, met: false })
    expect(bars[0]).toEqual({ key: '2026-03-03', total: 0, met: false })
  })
})

describe('nextReminderDelay', () => {
  const W = { startHour: 9, endHour: 22, intervalMin: 60 }
  const H = 3600000
  it('disattivato, goal raggiunto o intervallo non valido => null', () => {
    expect(nextReminderDelay({ ...W, enabled: false }, at(2026, 3, 5, 10, 0))).toBeNull()
    expect(nextReminderDelay({ ...W, enabled: true, goalMet: true }, at(2026, 3, 5, 10, 0))).toBeNull()
    expect(nextReminderDelay({ ...W, enabled: true, intervalMin: 0 }, at(2026, 3, 5, 10, 0))).toBeNull()
  })
  it('nessuna storia: primo promemoria all’apertura della finestra, subito se già dentro', () => {
    expect(nextReminderDelay({ ...W, enabled: true }, at(2026, 3, 5, 7, 0))).toBe(2 * H)
    expect(nextReminderDelay({ ...W, enabled: true }, at(2026, 3, 5, 10, 0))).toBe(0)
  })
  it('l’intervallo parte dall’ultimo log, non da orari fissi', () => {
    const lastLogTs = at(2026, 3, 5, 10, 0).getTime()
    expect(nextReminderDelay({ ...W, enabled: true, lastLogTs }, at(2026, 3, 5, 10, 30))).toBe(30 * 60000)
    expect(nextReminderDelay({ ...W, enabled: true, lastLogTs }, at(2026, 3, 5, 12, 30))).toBe(0)
  })
  it('un log recente sposta in avanti il prossimo promemoria', () => {
    const lastLogTs = at(2026, 3, 5, 10, 0).getTime()
    const d = nextReminderDelay({ ...W, enabled: true, lastLogTs }, at(2026, 3, 5, 10, 30))
    const d2 = nextReminderDelay({ ...W, enabled: true, lastLogTs: at(2026, 3, 5, 10, 30).getTime() }, at(2026, 3, 5, 10, 30))
    expect(d).toBe(30 * 60000)
    expect(d2).toBe(60 * 60000)
  })
  it('fuori dalla finestra aspetta l’apertura (mai di notte)', () => {
    const lastLogTs = at(2026, 3, 5, 10, 0).getTime()
    expect(nextReminderDelay({ ...W, enabled: true, lastLogTs }, at(2026, 3, 5, 23, 30))).toBe(9.5 * H)
    expect(nextReminderDelay({ ...W, enabled: true, lastLogTs }, at(2026, 3, 5, 7, 0))).toBe(2 * H)
  })
})

describe('computeGoal', () => {
  const T = at(2026, 3, 10, 12)
  it('nessun dato => 2000', () => {
    expect(computeGoal([], T)).toBe(2000)
  })
  it('meno di 3 giorni con bevute => 2000', () => {
    const e = [entry(at(2026, 3, 8), 1600), entry(at(2026, 3, 9), 1800)]
    expect(computeGoal(e, T)).toBe(2000)
  })
  it('media degli ultimi 7 giorni con bevute, arrotondata a 50', () => {
    const e = [entry(at(2026, 3, 7), 1600), entry(at(2026, 3, 8), 1700), entry(at(2026, 3, 9), 1800)]
    expect(computeGoal(e, T)).toBe(1700)
    const e2 = [entry(at(2026, 3, 7), 1660), entry(at(2026, 3, 8), 1700), entry(at(2026, 3, 9), 1840)]
    expect(computeGoal(e2, T)).toBe(1750)
  })
  it('i giorni senza bevute non contano come zero', () => {
    const e = [
      entry(at(2026, 3, 7), 1600), entry(at(2026, 3, 9), 1700), entry(at(2026, 3, 10), 1800)
    ]
    expect(computeGoal(e, T)).toBe(1700)
  })
  it('solo gli ultimi 7 giorni con bevute entrano nella media', () => {
    const e = [entry(at(2026, 3, 1), 4000)]
    for (let d = 4; d <= 10; d++) e.push(entry(at(2026, 3, d), 2500))
    expect(computeGoal(e, T)).toBe(2500)
  })
  it('clamp: troppo basso => 1500, troppo alto => 4000', () => {
    const low = [entry(at(2026, 3, 8), 500), entry(at(2026, 3, 9), 700), entry(at(2026, 3, 10), 400)]
    expect(computeGoal(low, T)).toBe(1500)
    const high = [entry(at(2026, 3, 8), 5000), entry(at(2026, 3, 9), 6000), entry(at(2026, 3, 10), 5500)]
    expect(computeGoal(high, T)).toBe(4000)
  })
  it('ignora i giorni futuri', () => {
    const e = [
      entry(at(2026, 3, 8), 2000), entry(at(2026, 3, 9), 2000), entry(at(2026, 3, 10), 2000),
      entry(at(2026, 3, 12), 4000)
    ]
    expect(computeGoal(e, T)).toBe(2000)
  })
})

describe('computeGoal individuale (peso, attività, stagione)', () => {
  const T = at(2026, 3, 10, 12)
  const ESTATE = at(2026, 7, 10, 12)

  it('peso senza storico => formula individuo', () => {
    expect(computeGoal([], T, { weightKg: 75, activity: 'moderate' })).toBe(2700)
  })
  it('peso + storico => media dei due', () => {
    const e = [entry(at(2026, 3, 8), 1600), entry(at(2026, 3, 9), 1700), entry(at(2026, 3, 10), 1800)]
    expect(computeGoal(e, T, { weightKg: 75, activity: 'moderate' })).toBe(2200)
  })
  it('attività: sportivo beve di più di sedentario', () => {
    const sed = computeGoal([], T, { weightKg: 75, activity: 'sedentary' })
    const act = computeGoal([], T, { weightKg: 75, activity: 'active' })
    expect(sed).toBe(2500)
    expect(act).toBe(3100)
    expect(act).toBeGreaterThan(sed)
  })
  it('estate idrata di più a parità di peso', () => {
    const winter = computeGoal([], T, { weightKg: 75, activity: 'moderate' })
    const summer = computeGoal([], ESTATE, { weightKg: 75, activity: 'moderate' })
    expect(summer).toBe(2900)
    expect(summer).toBeGreaterThan(winter)
  })
  it('peso estremo resta nei limiti', () => {
    expect(computeGoal([], ESTATE, { weightKg: 130, activity: 'active' })).toBe(4000)
    expect(computeGoal([], T, { weightKg: 35, activity: 'sedentary' })).toBe(1500)
  })
})

describe('activeWindow (fascia oraria automatica dalle bevute)', () => {
  const FALLBACK = { startHour: 9, endHour: 22 }
  const T = at(2026, 3, 12, 12)

  it('senza bevute usa il fallback', () => {
    expect(activeWindow([], T, FALLBACK)).toEqual(FALLBACK)
  })

  it('con bevute 8:00..23:00 estende la fascia', () => {
    const e = [
      entry(at(2026, 3, 9, 8), 250),
      entry(at(2026, 3, 10, 8), 250),
      entry(at(2026, 3, 10, 17, 30), 250),
      entry(at(2026, 3, 11, 23), 250),
      entry(at(2026, 3, 12, 12), 250)
    ]
    const w = activeWindow(e, T, FALLBACK)
    expect(w.startHour).toBeLessThanOrEqual(8)
    expect(w.endHour).toBeGreaterThanOrEqual(23)
  })

  it('con poca storia (meno di 4 giorni) NON adatta: resta il fallback', () => {
    const e = [
      entry(at(2026, 3, 10, 19, 36), 250),
      entry(at(2026, 3, 11, 12), 250),
      entry(at(2026, 3, 12, 15), 250)
    ]
    expect(activeWindow(e, T, FALLBACK)).toEqual(FALLBACK)
  })

  it('ignora bevute più vecchie dei PRIMI 30 giorni', () => {
    const e = [entry(at(2026, 1, 3, 6), 250), entry(at(2026, 3, 10, 10), 250)]
    const w = activeWindow(e, T, FALLBACK)
    expect(w.startHour).not.toBeLessThan(5)
    expect(w.endHour).toBeGreaterThanOrEqual(10)
  })

  it('clampa a una finestra sensata (mai di notte piena, minimo 12 ore)', () => {
    const e = [
      entry(at(2026, 3, 10, 2), 250),
      entry(at(2026, 3, 10, 3), 250),
      entry(at(2026, 3, 10, 23, 30), 250)
    ]
    const w = activeWindow(e, T, FALLBACK)
    expect(w.startHour).toBeGreaterThanOrEqual(5)
    expect(w.endHour).toBeLessThanOrEqual(23)
    expect(w.endHour - w.startHour).toBeGreaterThanOrEqual(11)
  })
})

describe('goalBreakdown (conto trasparente del goal)', () => {
  it('scompone la formula individuo in ml', () => {
    const b = goalBreakdown(72, 'sedentary', at(2026, 3, 10))
    expect(b.base).toBe(2376)
    expect(b.activityFactor).toBe(1)
    expect(b.seasonFactor).toBe(1)
    expect(b.rounded).toBe(2400)
    expect(b.glasses).toBe(10)
    expect(b.activityLabel).toBe('Sedentario')
  })

  it('estate alza il fattore stagionale', () => {
    const b = goalBreakdown(72, 'sedentary', at(2026, 7, 10))
    expect(b.seasonFactor).toBeCloseTo(1.06)
  })
})

describe('adaptedInterval (intervallo che si adatta ai risultati)', () => {
  const T = at(2026, 3, 10, 12)
  const GOAL = 2000
  const day = (offset, ml) => entry(at(T.getFullYear(), T.getMonth() + 1, T.getDate() + offset), ml)
  const pack = (totals) => totals.map((ml, i) => (ml == null ? null : day(i - 7, ml))).filter(Boolean)

  it('7 giorni pieni => allenta di 30, senza superare 240', () => {
    expect(adaptedInterval(60, pack([2000, 2000, 2000, 2000, 2000, 2000, 2000]), GOAL, T)).toBe(90)
    expect(adaptedInterval(240, pack([2000, 2000, 2000, 2000, 2000, 2000, 2000]), GOAL, T)).toBe(240)
  })

  it('giorni sempre sotto => stringe di 30, senza scendere sotto 30', () => {
    expect(adaptedInterval(60, pack([800, 900, 700, 1000, 800, 600, 900]), GOAL, T)).toBe(30)
    expect(adaptedInterval(30, pack([800, 900, 700, 1000, 800, 600, 900]), GOAL, T)).toBe(30)
  })

  it('risultati misti => lascia l’intervallo invariato', () => {
    expect(adaptedInterval(60, pack([2000, 800, 2000, 1000, 2000, 1500, 2000]), GOAL, T)).toBe(60)
  })

  it('meno di 3 giorni con dati => non tocca nulla (troppa poca storia)', () => {
    expect(adaptedInterval(60, pack([2000, 2000, null, null, null, null, null]), GOAL, T)).toBe(60)
  })

  it('nessuna bevuta negli ultimi 7 giorni => non adatta', () => {
    expect(adaptedInterval(60, [], GOAL, T)).toBe(60)
  })
})
