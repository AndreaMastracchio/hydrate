import { describe, it, expect, beforeEach } from 'vitest'
import { setLocale, fmtCountdown, t } from './i18n.js'

beforeEach(() => setLocale('it'))

describe('fmtCountdown', () => {
  it('ritorna null quando non c’è uno scatto', () => {
    expect(fmtCountdown(null)).toBeNull()
  })
  it('a zero dice "adesso"', () => {
    expect(fmtCountdown(0)).toBe('adesso')
  })
  it('sotto l’ora in minuti (it)', () => {
    expect(fmtCountdown(25 * 60_000)).toBe('tra 25 min')
  })
  it('ore e minuti (it)', () => {
    expect(fmtCountdown(90 * 60_000)).toBe('tra 1h 30m')
  })
  it('ora tonda senza minuti (it)', () => {
    expect(fmtCountdown(2 * 3600_000)).toBe('tra 2h')
  })
  it('inglese', () => {
    setLocale('en')
    expect(fmtCountdown(0)).toBe('now')
    expect(fmtCountdown(25 * 60_000)).toBe('in 25 min')
    expect(fmtCountdown(90 * 60_000)).toBe('in 1h 30m')
  })
})

describe('chorus home.next senza doppio "tra"', () => {
  it('it: "prossimo bicchiere tra 25 min" una sola volta', () => {
    setLocale('it')
    const out = t('home.next', { when: fmtCountdown(25 * 60_000) })
    expect(out).toBe('prossimo bicchiere tra 25 min')
    expect(out.match(/tra/g)).toHaveLength(1)
  })
  it('en: "next glass in 25 min"', () => {
    setLocale('en')
    const out = t('home.next', { when: fmtCountdown(25 * 60_000) })
    expect(out).toBe('next glass in 25 min')
  })
})

describe('profile.footer senza versione hardcoded', () => {
  it('prende la versione da {v}, non la incolla nel testo', () => {
    setLocale('it')
    const out = t('profile.footer', { v: '9.9.9' })
    expect(out).toContain('Hydrate 9.9.9')
    expect(out).not.toMatch(/v0\./)
  })
})