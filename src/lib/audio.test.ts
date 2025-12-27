import { describe, it, expect } from 'vitest'
import { sineSaturation, sineSaturationStereo } from './audio'

describe('sineSaturation', () => {
  it('applies saturation effect to audio samples', () => {
    const samples = new Float32Array([1000, 2000, 3000, -1000, -2000])
    const result = sineSaturation(samples, 50, 0) // 50% mix, 0db pre-gain

    expect(result.length).toBe(samples.length)
    expect(result).not.toEqual(samples) // Should be modified
  })

  it('handles zero mix (no saturation)', () => {
    const samples = new Float32Array([1000, 2000, 3000])
    const result = sineSaturation(samples, 0, 0) // 0% mix

    // With 0% mix, should return original samples
    expect(result).toEqual(samples)
  })

  it('handles 100% mix (full saturation)', () => {
    const samples = new Float32Array([1000, 2000, 3000])
    const result = sineSaturation(samples, 100, 0) // 100% mix

    expect(result.length).toBe(samples.length)
    // Should apply full saturation effect
    expect(result).not.toEqual(samples)
  })

  it('applies pre-gain before saturation', () => {
    const samples = new Float32Array([1000, 2000, 3000])
    const resultNoGain = sineSaturation(samples, 50, 0) // 0db
    const resultWithGain = sineSaturation(samples, 50, 6) // +6db

    // With gain, samples should be louder before saturation
    expect(resultWithGain).not.toEqual(resultNoGain)
  })

  it('clips samples to max value before saturation', () => {
    const samples = new Float32Array([50000, 60000, 70000]) // Very large values
    const result = sineSaturation(samples, 50, 0)

    // Should handle clipping gracefully
    expect(result.length).toBe(samples.length)
    expect(Number.isFinite(result[0])).toBe(true)
  })

  it('handles negative samples', () => {
    const samples = new Float32Array([-1000, -2000, -3000])
    const result = sineSaturation(samples, 50, 0)

    expect(result.length).toBe(samples.length)
    expect(result[0]).toBeLessThanOrEqual(0) // Should preserve sign
  })

  it('handles empty samples array', () => {
    const samples = new Float32Array(0)
    const result = sineSaturation(samples, 50, 0)

    expect(result.length).toBe(0)
  })
})

describe('sineSaturationStereo', () => {
  it('applies saturation to both left and right channels', () => {
    const samples: [Float32Array, Float32Array] = [
      new Float32Array([1000, 2000, 3000]),
      new Float32Array([1500, 2500, 3500]),
    ]
    const result = sineSaturationStereo(samples, 50, 0)

    expect(result[0].length).toBe(samples[0].length)
    expect(result[1].length).toBe(samples[1].length)
    expect(result[0]).not.toEqual(samples[0])
    expect(result[1]).not.toEqual(samples[1])
  })

  it('applies same saturation parameters to both channels', () => {
    const samples: [Float32Array, Float32Array] = [
      new Float32Array([1000, 2000]),
      new Float32Array([1000, 2000]),
    ]
    const result = sineSaturationStereo(samples, 50, 0)

    // Both channels should have saturation applied
    expect(result[0]).not.toEqual(samples[0])
    expect(result[1]).not.toEqual(samples[1])
  })

  it('handles different values in left and right channels', () => {
    const samples: [Float32Array, Float32Array] = [
      new Float32Array([1000, 2000]),
      new Float32Array([5000, 6000]),
    ]
    const result = sineSaturationStereo(samples, 50, 0)

    // Both channels should be processed independently
    expect(result[0]).not.toEqual(samples[0])
    expect(result[1]).not.toEqual(samples[1])
    expect(result[0]).not.toEqual(result[1]) // Different input = different output
  })

  it('handles zero mix for stereo', () => {
    const samples: [Float32Array, Float32Array] = [
      new Float32Array([1000, 2000]),
      new Float32Array([1500, 2500]),
    ]
    const result = sineSaturationStereo(samples, 0, 0)

    expect(result[0]).toEqual(samples[0])
    expect(result[1]).toEqual(samples[1])
  })

  it('handles pre-gain for stereo', () => {
    const samples: [Float32Array, Float32Array] = [
      new Float32Array([1000, 2000]),
      new Float32Array([1500, 2500]),
    ]
    const resultNoGain = sineSaturationStereo(samples, 50, 0)
    const resultWithGain = sineSaturationStereo(samples, 50, 12) // +12db

    expect(resultWithGain[0]).not.toEqual(resultNoGain[0])
    expect(resultWithGain[1]).not.toEqual(resultNoGain[1])
  })
})

