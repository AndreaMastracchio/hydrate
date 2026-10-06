import { describe, it, expect } from 'vitest'
import { reminderOptions } from './notify.js'

describe('reminderOptions', () => {
  const opts = reminderOptions()
  it('chiede conferma con «Ho bevuto» e congeda con «Più tardi»', () => {
    expect(opts.actions).toEqual([
      { action: 'log', title: 'Ho bevuto' },
      { action: 'later', title: 'Più tardi' }
    ])
  })
  it('parla di bicchiere, mai di millilitri', () => {
    expect(opts.body).toContain('bicchiere')
    expect(opts.body).not.toMatch(/\d+\s*ml/)
  })
  it('silenziosa e con tag unico per non impilare notifiche', () => {
    expect(opts.silent).toBe(true)
    expect(opts.tag).toBe('hydrate-reminder')
  })
})
