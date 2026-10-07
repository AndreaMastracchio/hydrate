import { describe, it, expect, beforeEach } from 'vitest'
import { setLocale, fmtCountdown } from './i18n.js'

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