import { describe, it, expect } from 'vitest'
import { getStepSize } from './getStepSize'
import { SAMPLE_RATE } from '../lib/consts'

describe('getStepSize', () => {
  it('calculates step size correctly for 120 BPM', () => {
    const bpm = 120
    const expected = (60 / bpm / 4) * SAMPLE_RATE
    expect(getStepSize(bpm)).toBe(expected)
  })

  it('calculates step size correctly for 160 BPM', () => {
    const bpm = 160
    const expected = (60 / bpm / 4) * SAMPLE_RATE
    expect(getStepSize(bpm)).toBe(expected)
  })

  it('calculates step size correctly for 80 BPM', () => {
    const bpm = 80
    const expected = (60 / bpm / 4) * SAMPLE_RATE
    expect(getStepSize(bpm)).toBe(expected)
  })

  it('returns a positive number for any valid BPM', () => {
    expect(getStepSize(60)).toBeGreaterThan(0)
    expect(getStepSize(180)).toBeGreaterThan(0)
  })

  it('handles decimal BPM values', () => {
    const bpm = 120.5
    const result = getStepSize(bpm)
    expect(result).toBeGreaterThan(0)
    expect(Number.isFinite(result)).toBe(true)
  })
})
