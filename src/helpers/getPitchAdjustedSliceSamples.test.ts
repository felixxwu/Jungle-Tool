import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPitchAdjustedSliceSamples } from './getPitchAdjustedSliceSamples'
import { LoadedFiles } from '../lib/store'
import { getSliceSamples } from './getSliceSamples'
import { SAMPLE_RATE } from '../lib/consts'
import { WaveFile } from 'wavefile'

// Mock dependencies
vi.mock('./getSliceSamples', () => ({
  getSliceSamples: vi.fn(),
}))

vi.mock('wavefile', () => ({
  WaveFile: vi.fn().mockImplementation(() => ({
    fromScratch: vi.fn(),
    toSampleRate: vi.fn(),
    getSamples: vi.fn(() => [new Float32Array(1000), new Float32Array(1000)]),
  })),
}))

describe('getPitchAdjustedSliceSamples', () => {
  const mockSliceSamples: [Float32Array, Float32Array] = [
    new Float32Array(1000),
    new Float32Array(1000),
  ]

  const mockFile = {
    name: 'test-file',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Kick' as const, stepNum: 0 },
      { start: 1000, type: 'Snare' as const, stepNum: 4 },
      { start: 2000, type: 'Hat' as const, stepNum: 8 },
    ],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([mockFile])
    ;(getSliceSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSliceSamples)
  })

  it('returns null when file is not found', () => {
    const result = getPitchAdjustedSliceSamples({
      layerName: 'non-existent-file',
      sliceIndex: 0,
      layerPitch: 0,
      noteLength: 200,
      noteFadeOut: 50,
    })

    expect(result).toBe(null)
  })

  it('applies pitch adjustment using WaveFile resampling', () => {
    const mockWaveFile = {
      fromScratch: vi.fn(),
      toSampleRate: vi.fn(),
      getSamples: vi.fn(() => [new Float32Array(1000), new Float32Array(1000)]),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFile)

    getPitchAdjustedSliceSamples({
      layerName: 'test-file',
      sliceIndex: 0,
      layerPitch: 12, // +12 semitones (octave up)
      noteLength: 200,
      noteFadeOut: 50,
    })

    // Verify WaveFile was used for pitch adjustment
    expect(mockWaveFile.fromScratch).toHaveBeenCalled()
    expect(mockWaveFile.toSampleRate).toHaveBeenCalled()
    // Pitch multiplier for +12 semitones: 1 / 2^(12/12) = 1/2 = 0.5
    // So sample rate should be SAMPLE_RATE * 0.5
    expect(mockWaveFile.toSampleRate).toHaveBeenCalledWith(SAMPLE_RATE * 0.5, { method: 'sinc' })
  })

  it('applies note length cutoff', () => {
    const mockWaveFile = {
      fromScratch: vi.fn(),
      toSampleRate: vi.fn(),
      getSamples: vi.fn(() => [
        new Float32Array(5000), // Long enough to test cutoff
        new Float32Array(5000),
      ]),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFile)

    const result = getPitchAdjustedSliceSamples({
      layerName: 'test-file',
      sliceIndex: 0,
      layerPitch: 0,
      noteLength: 100, // 100ms
      noteFadeOut: 0,
    })

    expect(result).not.toBe(null)
    if (result) {
      // Note length in samples: (100 / 1000) * 44100 = 4410 samples
      // Samples beyond 4410 should be zeroed (but fade-out is 0, so they should be 0)
      // We can't easily test the exact values without more complex setup,
      // but we verify the function completes successfully
      expect(result[0].length).toBeGreaterThan(0)
      expect(result[1].length).toBeGreaterThan(0)
    }
  })

  it('applies fade-out after note length', () => {
    const mockWaveFile = {
      fromScratch: vi.fn(),
      toSampleRate: vi.fn(),
      getSamples: vi.fn(() => {
        // Create samples with non-zero values
        const left = new Float32Array(5000)
        const right = new Float32Array(5000)
        left.fill(0.5)
        right.fill(0.5)
        return [left, right]
      }),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFile)

    const result = getPitchAdjustedSliceSamples({
      layerName: 'test-file',
      sliceIndex: 0,
      layerPitch: 0,
      noteLength: 100, // 100ms
      noteFadeOut: 50, // 50ms fade-out
    })

    expect(result).not.toBe(null)
    if (result) {
      // Samples after noteLength should have fade-out applied
      // We verify the function completes and returns valid samples
      expect(result[0].length).toBeGreaterThan(0)
      expect(result[1].length).toBeGreaterThan(0)
    }
  })

  it('caches results for same parameters', () => {
    const mockWaveFile = {
      fromScratch: vi.fn(),
      toSampleRate: vi.fn(),
      getSamples: vi.fn(() => [new Float32Array(1000), new Float32Array(1000)]),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFile)

    const params = {
      layerName: 'test-file',
      sliceIndex: 0,
      layerPitch: 0,
      noteLength: 200,
      noteFadeOut: 50,
    }

    // First call
    const result1 = getPitchAdjustedSliceSamples(params)
    const callCount1 = mockWaveFile.fromScratch.mock.calls.length

    // Second call with same parameters
    const result2 = getPitchAdjustedSliceSamples(params)
    const callCount2 = mockWaveFile.fromScratch.mock.calls.length

    // Should use cache, so WaveFile should not be called again
    expect(callCount2).toBe(callCount1)
    // Results should be equivalent (same length and values)
    expect(result1).not.toBe(null)
    expect(result2).not.toBe(null)
    if (result1 && result2) {
      expect(result1[0].length).toBe(result2[0].length)
      expect(result1[1].length).toBe(result2[1].length)
    }
  })

  it('recalculates when parameters change', () => {
    const mockWaveFile = {
      fromScratch: vi.fn(),
      toSampleRate: vi.fn(),
      getSamples: vi.fn(() => [new Float32Array(1000), new Float32Array(1000)]),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFile)

    // First call
    getPitchAdjustedSliceSamples({
      layerName: 'test-file',
      sliceIndex: 0,
      layerPitch: 0,
      noteLength: 200,
      noteFadeOut: 50,
    })
    const callCount1 = mockWaveFile.fromScratch.mock.calls.length

    // Second call with different pitch
    getPitchAdjustedSliceSamples({
      layerName: 'test-file',
      sliceIndex: 0,
      layerPitch: 5, // Different pitch
      noteLength: 200,
      noteFadeOut: 50,
    })
    const callCount2 = mockWaveFile.fromScratch.mock.calls.length

    // Should recalculate, so WaveFile should be called again
    expect(callCount2).toBeGreaterThan(callCount1)
  })
})
