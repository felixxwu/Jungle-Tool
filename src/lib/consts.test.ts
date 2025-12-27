import { describe, it, expect } from 'vitest'
import { library } from './consts'

describe('Library', () => {
  it('contains 30+ classic break samples', () => {
    expect(library.length).toBeGreaterThanOrEqual(30)
  })

  it('contains expected classic breaks', () => {
    const expectedBreaks = [
      'Amen Brother (1)',
      'Amen Brother (2)',
      'Think (1)',
      'Funky Drummer',
      'Apache',
      'Think (Clean)',
    ]

    expectedBreaks.forEach(breakName => {
      expect(library).toContain(breakName)
    })
  })

  it('has no duplicate entries', () => {
    const unique = new Set(library)
    expect(unique.size).toBe(library.length)
  })

  it('all entries are non-empty strings', () => {
    library.forEach(breakName => {
      expect(typeof breakName).toBe('string')
      expect(breakName.trim().length).toBeGreaterThan(0)
    })
  })
})
