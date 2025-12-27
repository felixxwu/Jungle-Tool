import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getBestLayerVolume } from './getBestLayerVolume'
import { LoadedFiles, LowestRMS } from '../lib/store'
import { getRMS } from './getRMS'
import { mono } from '../lib/audio'

// Mock helpers
vi.mock('./getRMS', () => ({
  getRMS: vi.fn(() => 0.5),
}))

vi.mock('../lib/audio', () => ({
  mono: vi.fn((samples: [Float32Array, Float32Array]) => samples[0]),
}))

describe('getBestLayerVolume', () => {
  const mockFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    LowestRMS.set(0.25) // Lower RMS = quieter file
    LoadedFiles.set([mockFile])
  })

  it('returns 100 if file is not found', () => {
    const result = getBestLayerVolume('non-existent-file')
    expect(result).toBe(100)
  })

  it('calculates volume based on RMS ratio', () => {
    // LowestRMS = 0.25, file RMS = 0.5
    // multiplier = 0.25 / 0.5 = 0.5
    // volume = 100 * 0.5 = 50
    ;(getRMS as ReturnType<typeof vi.fn>).mockReturnValue(0.5)

    const result = getBestLayerVolume('test-file')
    expect(result).toBe(50)
    expect(getRMS).toHaveBeenCalled()
    expect(mono).toHaveBeenCalledWith(mockFile.samples)
  })

  it('returns 100 when file RMS equals LowestRMS', () => {
    ;(getRMS as ReturnType<typeof vi.fn>).mockReturnValue(0.25)
    LowestRMS.set(0.25)

    const result = getBestLayerVolume('test-file')
    expect(result).toBe(100)
  })

  it('returns lower volume for louder files', () => {
    ;(getRMS as ReturnType<typeof vi.fn>).mockReturnValue(1.0)
    LowestRMS.set(0.25)
    // multiplier = 0.25 / 1.0 = 0.25
    // volume = 100 * 0.25 = 25

    const result = getBestLayerVolume('test-file')
    expect(result).toBe(25)
  })

  it('returns higher volume for quieter files', () => {
    ;(getRMS as ReturnType<typeof vi.fn>).mockReturnValue(0.1)
    LowestRMS.set(0.25)
    // multiplier = 0.25 / 0.1 = 2.5
    // volume = 100 * 2.5 = 250 (but should be capped or handled appropriately)

    const result = getBestLayerVolume('test-file')
    expect(result).toBe(250)
  })

  it('rounds volume to integer', () => {
    ;(getRMS as ReturnType<typeof vi.fn>).mockReturnValue(0.33)
    LowestRMS.set(0.25)
    // multiplier = 0.25 / 0.33 ≈ 0.7576
    // volume = 100 * 0.7576 ≈ 75.76, rounded = 76

    const result = getBestLayerVolume('test-file')
    expect(result).toBe(76)
  })
})

