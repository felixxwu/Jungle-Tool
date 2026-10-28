import { describe, expect, it } from 'vitest'
import { uniqueBreakName } from './uniqueBreakName'

describe('uniqueBreakName', () => {
  it('keeps a name nothing else uses', () => {
    expect(uniqueBreakName('break.wav', ['Apache'])).toBe('break.wav')
  })

  it('numbers a name that is already taken, from 2', () => {
    expect(uniqueBreakName('break.wav', ['break.wav'])).toBe('break.wav (2)')
    expect(uniqueBreakName('break.wav', ['break.wav', 'break.wav (2)'])).toBe('break.wav (3)')
  })
})
