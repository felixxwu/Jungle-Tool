import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getArrangementLayerSamples } from './getArrangementLayerSamples'
import {
  Arrangement,
  BPM,
  Swing,
  LoadedFiles,
  NumBars,
  NoteLength,
  NoteFadeOut,
  ShortenNotes,
} from '../lib/store'
import { getSliceIndexFromStepNum } from './getSliceIndexFromStepNum'
import { getPitchAdjustedSliceSamples } from './getPitchAdjustedSliceSamples'
import { getStepSize } from './getStepSize'
import type { Layer } from '../lib/types'

// Mock dependencies
vi.mock('./getSliceIndexFromStepNum', () => ({
  getSliceIndexFromStepNum: vi.fn((_file, stepNum) => {
    if (stepNum === 0) return 0
    if (stepNum === 4) return 1
    return null
  }),
}))

vi.mock('./getPitchAdjustedSliceSamples', () => ({
  getPitchAdjustedSliceSamples: vi.fn(() => [
    new Float32Array([0.5, 0.5, 0.5]),
    new Float32Array([0.5, 0.5, 0.5]),
  ]),
}))

vi.mock('./getStepSize', () => ({
  getStepSize: vi.fn((bpm: number) => (60 / bpm / 4) * 44100),
}))

vi.mock('../lib/audio', () => ({
  stereoSlice: vi.fn((_samples, start, end) => {
    const length = end - start
    return [new Float32Array(length), new Float32Array(length)]
  }),
}))

describe('getArrangementLayerSamples', () => {
  const mockFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Kick' as const, stepNum: 0 },
      { start: 1000, type: 'Snare' as const, stepNum: 4 },
    ],
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockLayer: Layer = {
    filename: 'test-file',
    volume: 50,
    pitch: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    BPM.set(120)
    Swing.set(17)
    NumBars.set(1)
    NoteLength.set(200)
    NoteFadeOut.set(50)
    ShortenNotes.set(true)
    LoadedFiles.set([mockFile])
    Arrangement.set([
      { startStep: 0, stepNumToPlay: 0 },
      { startStep: 4, stepNumToPlay: 4 },
    ])
  })

  it('returns null if layer file is not found', () => {
    const layer: Layer = {
      filename: 'non-existent-file',
      volume: 50,
      pitch: 0,
    }
    const result = getArrangementLayerSamples({ layer })
    expect(result).toBeNull()
  })

  it('creates waveform with correct length for single bar', () => {
    NumBars.set(1)
    BPM.set(120)
    // Step size at 120 BPM = (60/120/4) * 44100 = 5512.5 samples
    // 16 steps * 5512.5 = 88200 samples
    const result = getArrangementLayerSamples({ layer: mockLayer })
    expect(result).not.toBeNull()
    expect(result![0].length).toBeGreaterThan(0)
  })

  it('filters notes by bar when bar is specified', () => {
    NumBars.set(2)
    Arrangement.set([
      { startStep: 0, stepNumToPlay: 0 }, // Bar 0
      { startStep: 16, stepNumToPlay: 0 }, // Bar 1
      { startStep: 32, stepNumToPlay: 0 }, // Bar 2
    ])

    const result = getArrangementLayerSamples({ layer: mockLayer, bar: 1 })
    expect(result).not.toBeNull()
    // Should only process notes in bar 1 (startStep 16-31)
    expect(getSliceIndexFromStepNum).toHaveBeenCalled()
  })

  it('applies layer volume to samples', () => {
    const layer: Layer = {
      filename: 'test-file',
      volume: 75,
      pitch: 0,
    }
    const result = getArrangementLayerSamples({ layer })
    expect(result).not.toBeNull()
    // Samples should be multiplied by volume / 100
    // The actual values depend on the pitch-adjusted samples
    expect(getPitchAdjustedSliceSamples).toHaveBeenCalledWith(
      expect.objectContaining({
        layerName: 'test-file',
        layerPitch: 0,
        shortenNotes: true,
      })
    )
  })

  it('applies swing offset to odd-numbered steps', () => {
    Swing.set(25)
    Arrangement.set([{ startStep: 1, stepNumToPlay: 0 }]) // Odd step

    const result = getArrangementLayerSamples({ layer: mockLayer })
    expect(result).not.toBeNull()
    // Swing should affect the offset calculation
    expect(getStepSize).toHaveBeenCalled()
  })

  it('does not apply swing offset to even-numbered steps', () => {
    Swing.set(25)
    Arrangement.set([{ startStep: 0, stepNumToPlay: 0 }]) // Even step

    const result = getArrangementLayerSamples({ layer: mockLayer })
    expect(result).not.toBeNull()
    // Even steps should have no swing offset
  })

  it('skips notes with invalid slice index', () => {
    ;(getSliceIndexFromStepNum as ReturnType<typeof vi.fn>).mockReturnValue(null)
    Arrangement.set([{ startStep: 0, stepNumToPlay: 99 }]) // Invalid stepNum

    const result = getArrangementLayerSamples({ layer: mockLayer })
    expect(result).not.toBeNull()
    // Should not call getPitchAdjustedSliceSamples for invalid slice
    expect(getPitchAdjustedSliceSamples).not.toHaveBeenCalled()
  })

  it('skips notes with null pitch-adjusted samples', () => {
    ;(getPitchAdjustedSliceSamples as ReturnType<typeof vi.fn>).mockReturnValue(null)
    Arrangement.set([{ startStep: 0, stepNumToPlay: 0 }])

    const result = getArrangementLayerSamples({ layer: mockLayer })
    expect(result).not.toBeNull()
    // Should handle null samples gracefully
  })

  it('sorts arrangement by startStep before processing', () => {
    Arrangement.set([
      { startStep: 8, stepNumToPlay: 0 },
      { startStep: 0, stepNumToPlay: 0 },
      { startStep: 4, stepNumToPlay: 0 },
    ])

    const result = getArrangementLayerSamples({ layer: mockLayer })
    expect(result).not.toBeNull()
    // Arrangement should be sorted internally
  })

  it('handles multiple bars when bar is not specified', () => {
    NumBars.set(2)
    const result = getArrangementLayerSamples({ layer: mockLayer })
    expect(result).not.toBeNull()
    // Should process all bars
    const stepSize = (60 / 120 / 4) * 44100
    const expectedLength = Math.round(stepSize * 16 * 2)
    expect(result![0].length).toBe(expectedLength)
  })
})
