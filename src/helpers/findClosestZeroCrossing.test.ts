import { describe, it, expect } from 'vitest'
import { findClosestZeroCrossing } from './findClosestZeroCrossing'

describe('findClosestZeroCrossing', () => {
  it('finds forward zero-crossing when search direction is forward', () => {
    // Create samples with a zero-crossing at index 10
    // Samples: [0.1, 0.2, -0.1, -0.2, 0.1, 0.2, ...]
    const samples = new Float32Array(20)
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        samples[i] = 0.1 + i * 0.01
      } else {
        samples[i] = -0.1 - (i - 10) * 0.01
      }
    }
    // Zero-crossing occurs between index 9 and 10
    samples[9] = 0.05
    samples[10] = -0.05

    const result = findClosestZeroCrossing(samples, 5, 'forward')
    expect(result).toBe(10) // Should find the forward crossing
  })

  it('finds backward zero-crossing when search direction is backward', () => {
    // Create samples with zero-crossings at index 4 and 14
    // The backward search checks samples[i] and samples[i+1], so crossing at index 4 means
    // samples[4] and samples[5] have opposite signs
    const samples = new Float32Array(20)
    for (let i = 0; i < 20; i++) {
      if (i < 5) {
        samples[i] = 0.1
      } else if (i < 15) {
        samples[i] = -0.1
      } else {
        samples[i] = 0.1
      }
    }
    samples[4] = 0.05
    samples[5] = -0.05 // Crossing between 4 and 5
    samples[14] = -0.05
    samples[15] = 0.05 // Crossing between 14 and 15

    const result = findClosestZeroCrossing(samples, 10, 'backward')
    // Starting at 10, going backward, finds crossing at index 4 (samples[4] > 0, samples[5] < 0)
    expect(result).toBe(4)
  })

  it('finds closest zero-crossing when search direction is bidirectional', () => {
    // Create samples with zero-crossings at index 4 and 14
    const samples = new Float32Array(20)
    for (let i = 0; i < 20; i++) {
      if (i < 5) {
        samples[i] = 0.1
      } else if (i < 15) {
        samples[i] = -0.1
      } else {
        samples[i] = 0.1
      }
    }
    samples[4] = 0.05
    samples[5] = -0.05 // Crossing at index 4
    samples[14] = -0.05
    samples[15] = 0.05 // Crossing at index 14

    // Start at index 8, closer to index 4 (distance 4) than index 14 (distance 6)
    const result = findClosestZeroCrossing(samples, 8, 'bidirectional')
    expect(result).toBe(4) // Should find the closer backward crossing
  })

  it('returns start position when no zero-crossing is found forward', () => {
    // All positive samples
    const samples = new Float32Array(20)
    for (let i = 0; i < 20; i++) {
      samples[i] = 0.1
    }

    const result = findClosestZeroCrossing(samples, 10, 'forward')
    expect(result).toBe(10) // Should return start position
  })

  it('returns start position when no zero-crossing is found backward', () => {
    // All negative samples
    const samples = new Float32Array(20)
    for (let i = 0; i < 20; i++) {
      samples[i] = -0.1
    }

    const result = findClosestZeroCrossing(samples, 10, 'backward')
    expect(result).toBe(10) // Should return start position
  })

  it('handles zero-crossing at exact start position', () => {
    const samples = new Float32Array(10)
    samples[0] = -0.05
    samples[1] = 0.05
    for (let i = 2; i < 10; i++) {
      samples[i] = 0.1
    }

    const result = findClosestZeroCrossing(samples, 1, 'bidirectional')
    expect(result).toBe(1) // Should find the crossing at start
  })

  it('defaults to bidirectional search when no direction specified', () => {
    const samples = new Float32Array(20)
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        samples[i] = 0.1
      } else {
        samples[i] = -0.1
      }
    }
    samples[9] = 0.05
    samples[10] = -0.05 // Crossing at index 9 (samples[9] > 0, samples[10] < 0)

    const result = findClosestZeroCrossing(samples, 9)
    // At position 9, forward finds 9 (distance 0), backward finds 9 (distance 0), so returns 9
    expect(result).toBe(9)
  })
})
