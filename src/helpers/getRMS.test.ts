import { describe, it, expect } from 'vitest'
import { getRMS } from './getRMS'

describe('getRMS', () => {
  it('calculates RMS for a simple array', () => {
    const samples = new Float32Array([1, 1, 1, 1])
    const rms = getRMS(samples)
    // RMS = sqrt((1^2 + 1^2 + 1^2 + 1^2) / 4) = sqrt(1) = 1
    expect(rms).toBe(1)
  })

  it('calculates RMS for array with different values', () => {
    const samples = new Float32Array([0, 1, 2, 3])
    const rms = getRMS(samples)
    // RMS = sqrt((0^2 + 1^2 + 2^2 + 3^2) / 4) = sqrt((0 + 1 + 4 + 9) / 4) = sqrt(14/4) = sqrt(3.5)
    expect(rms).toBeCloseTo(Math.sqrt(3.5), 5)
  })

  it('calculates RMS for array with negative values', () => {
    const samples = new Float32Array([-1, 1, -2, 2])
    const rms = getRMS(samples)
    // RMS = sqrt(((-1)^2 + 1^2 + (-2)^2 + 2^2) / 4) = sqrt((1 + 1 + 4 + 4) / 4) = sqrt(10/4) = sqrt(2.5)
    expect(rms).toBeCloseTo(Math.sqrt(2.5), 5)
  })

  it('handles empty array', () => {
    const samples = new Float32Array(0)
    const rms = getRMS(samples)
    // RMS = sqrt(0 / 0) = NaN
    expect(rms).toBeNaN()
  })

  it('handles array with zeros', () => {
    const samples = new Float32Array([0, 0, 0, 0])
    const rms = getRMS(samples)
    expect(rms).toBe(0)
  })

  it('handles single value array', () => {
    const samples = new Float32Array([5])
    const rms = getRMS(samples)
    // RMS = sqrt(5^2 / 1) = 5
    expect(rms).toBe(5)
  })

  it('handles large array', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i / 1000)
    const samples = new Float32Array(values)
    const rms = getRMS(samples)
    // Should calculate correctly for large arrays
    expect(rms).toBeGreaterThan(0)
    expect(rms).toBeLessThan(1)
  })
})

