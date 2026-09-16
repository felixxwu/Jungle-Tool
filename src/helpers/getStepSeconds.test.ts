import { describe, it, expect } from 'vitest'
import { getStepSeconds } from './getStepSeconds'
import { getStepSize } from './getStepSize'
import { SAMPLE_RATE } from '../lib/consts'

describe('getStepSeconds', () => {
  it('returns a 16th note in seconds at 120 BPM', () => {
    expect(getStepSeconds(120)).toBeCloseTo(0.125, 10)
  })

  it('agrees with getStepSize converted to seconds', () => {
    for (const bpm of [80, 120, 160, 180]) {
      expect(getStepSeconds(bpm)).toBeCloseTo(getStepSize(bpm) / SAMPLE_RATE, 10)
    }
  })
})
