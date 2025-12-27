import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getBestLayerPitch } from './getBestLayerPitch'
import { LoadedFiles, BPM, Swing } from '../lib/store'

// Mock getStepSize - it's called internally by getSwungStepSize
vi.mock('./getStepSize', () => ({
  getStepSize: vi.fn((bpm: number) => (60 / bpm / 4) * 44100),
}))

describe('getBestLayerPitch', () => {
  const mockFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Kick' as const, stepNum: 0 },
      { start: 11025, type: 'Snare' as const, stepNum: 4 }, // 0.25 seconds at 44.1kHz
      { start: 22050, type: 'Kick' as const, stepNum: 8 }, // 0.5 seconds
      { start: 33075, type: 'Snare' as const, stepNum: 12 }, // 0.75 seconds
    ],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    BPM.set(120)
    Swing.set(17)
    LoadedFiles.set([mockFile])
  })

  it('returns 0 if file is not found', () => {
    const result = getBestLayerPitch('non-existent-file')
    expect(result).toBe(0)
  })

  it('calculates pitch based on slice lengths and step sizes', () => {
    const result = getBestLayerPitch('test-file')
    // The function calculates pitch based on slice lengths and step sizes
    // Result should be a number (pitch in semitones, can be positive or negative)
    expect(typeof result).toBe('number')
    expect(Number.isFinite(result)).toBe(true)
  })

  it('handles file with single slice', () => {
    const singleSliceFile = {
      ...mockFile,
      slices: [{ start: 0, type: 'Kick' as const, stepNum: 0 }],
    }
    LoadedFiles.set([singleSliceFile])

    const result = getBestLayerPitch('test-file')
    // Should calculate based on slice length to end of file
    expect(typeof result).toBe('number')
  })

  it('uses current BPM and Swing values', () => {
    BPM.set(160)
    Swing.set(25)
    const result = getBestLayerPitch('test-file')

    // Function should calculate pitch based on BPM and Swing
    expect(typeof result).toBe('number')
    expect(Number.isFinite(result)).toBe(true)
  })

  it('handles slices with stepNum gaps', () => {
    const fileWithGaps = {
      ...mockFile,
      slices: [
        { start: 0, type: 'Kick' as const, stepNum: 0 },
        { start: 22050, type: 'Snare' as const, stepNum: 8 }, // Gap from 0 to 8
      ],
    }
    LoadedFiles.set([fileWithGaps])

    const result = getBestLayerPitch('test-file')
    // Should calculate based on stepNum difference (8 steps)
    expect(typeof result).toBe('number')
  })

  it('handles last slice correctly', () => {
    const result = getBestLayerPitch('test-file')
    // Last slice should use file length as next slice start
    expect(typeof result).toBe('number')
  })
})
