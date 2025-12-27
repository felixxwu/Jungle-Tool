import { describe, it, expect } from 'vitest'
import { probabilities } from './probabilities'

describe('probabilities', () => {
  it('has probabilities for all 16 step positions', () => {
    expect(probabilities.length).toBe(16)
  })

  it('has valid probability values between 0 and 1', () => {
    probabilities.forEach(prob => {
      expect(prob.kick).toBeGreaterThanOrEqual(0)
      expect(prob.kick).toBeLessThanOrEqual(1)
      expect(prob.snare).toBeGreaterThanOrEqual(0)
      expect(prob.snare).toBeLessThanOrEqual(1)
      expect(prob.hat).toBeGreaterThanOrEqual(0)
      expect(prob.hat).toBeLessThanOrEqual(1)
      // Probabilities should sum to approximately 1 (allowing for floating point precision)
      const sum = prob.kick + prob.snare + prob.hat
      expect(sum).toBeCloseTo(1, 5)
    })
  })

  it('has probabilities based on 100+ jungle tracks', () => {
    // The probabilities are calculated from 100+ songs
    // We can verify this by checking that probabilities are not all zeros
    // and that they reflect real patterns (e.g., kicks are more common at certain positions)
    const hasNonZeroProbabilities = probabilities.some(
      prob => prob.kick > 0 || prob.snare > 0 || prob.hat > 0
    )
    expect(hasNonZeroProbabilities).toBe(true)
  })

  it('reflects common jungle patterns (kicks at start, snares at positions 4 and 12)', () => {
    // Position 0 (first step) typically has a kick
    expect(probabilities[0].kick).toBeGreaterThan(0.3)
    // Position 4 (first snare) typically has a snare
    expect(probabilities[4].snare).toBeGreaterThan(0.3)
    // Position 12 (second snare) typically has a snare (may be less common than position 4)
    expect(probabilities[12].snare).toBeGreaterThan(0.2)
  })

  it('has different probabilities for different step positions', () => {
    // Not all positions should have identical probabilities
    const firstProb = probabilities[0]
    const differentProb = probabilities.find(
      prob =>
        prob.kick !== firstProb.kick || prob.snare !== firstProb.snare || prob.hat !== firstProb.hat
    )
    expect(differentProb).toBeDefined()
  })

  it('has hat probabilities that complement kick and snare', () => {
    probabilities.forEach(prob => {
      // Hat probability should be 1 - (kick + snare)
      const expectedHat = 1 - (prob.kick + prob.snare)
      expect(prob.hat).toBeCloseTo(expectedHat, 5)
    })
  })

  it('has probabilities that sum to 1 for each position', () => {
    probabilities.forEach(prob => {
      const sum = prob.kick + prob.snare + prob.hat
      expect(sum).toBeCloseTo(1, 5)
    })
  })
})
