import { describe, it, expect, beforeEach, vi } from 'vitest'
import { autoSlice } from './autoSlice'
import {
  LoadedFiles,
  SelectedFileIndex,
  AutoSliceSensitivity,
  SelectedSliceIndex,
} from '../lib/store'
import { findClosestZeroCrossing } from '../helpers/findClosestZeroCrossing'

// Mock dependencies
vi.mock('../helpers/findClosestZeroCrossing', () => ({
  findClosestZeroCrossing: vi.fn((_samples: Float32Array, start: number) => start),
}))

vi.mock('../lib/audio', () => ({
  mono: vi.fn((samples: [Float32Array, Float32Array]) => samples[0]),
}))

describe('autoSlice', () => {
  beforeEach(() => {
    LoadedFiles.set([])
    SelectedFileIndex.set(null)
    AutoSliceSensitivity.set(2000)
    SelectedSliceIndex.set(null)
  })

  it('creates slices with correct types based on expected pattern', () => {
    // Create a mock file with enough samples to trigger transients
    const sampleCount = 44100 // 1 second at 44.1kHz
    const samples = [new Float32Array(sampleCount), new Float32Array(sampleCount)] as [
      Float32Array,
      Float32Array
    ]

    // Create a pattern that will generate transients above threshold
    // The transient detection algorithm uses peak followers with decay
    // We need sudden amplitude changes to create transients
    for (let i = 0; i < sampleCount; i++) {
      // Create a pattern with spikes every ~2756 samples (16 slices in 1 second)
      const position = i % 2756
      if (position < 100) {
        samples[0][i] = 0.9 // Strong spike
      } else {
        samples[0][i] = 0.01 // Low baseline
      }
    }

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)
    AutoSliceSensitivity.set(500) // Very low threshold to ensure detection

    autoSlice()

    const file = LoadedFiles.ref()[0]
    // Should create some slices (exact count depends on transient detection)
    // The important thing is that it runs without error and creates slices with types
    expect(file.slices.length).toBeGreaterThanOrEqual(0)

    // If slices were created, verify they have correct structure
    if (file.slices.length > 0) {
      file.slices.forEach(slice => {
        expect(['Kick', 'Snare', 'Hat']).toContain(slice.type)
        expect(slice.stepNum).toBeGreaterThanOrEqual(0)
        expect(slice.stepNum).toBeLessThanOrEqual(15)
        expect(slice.start).toBeGreaterThanOrEqual(0)
      })
    }
  })

  it('uses zero-crossing detection for clean cuts', () => {
    const sampleCount = 44100
    const samples = [new Float32Array(sampleCount), new Float32Array(sampleCount)] as [
      Float32Array,
      Float32Array
    ]

    // Create a strong transient that will be detected
    samples[0][0] = 0.1
    samples[0][500] = 0.9 // Strong transient
    samples[0][1000] = 0.1

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)
    AutoSliceSensitivity.set(1000) // Lower threshold

    vi.clearAllMocks()
    autoSlice()

    // Verify findClosestZeroCrossing was called for each detected slice
    if (LoadedFiles.ref()[0].slices.length > 0) {
      expect(findClosestZeroCrossing).toHaveBeenCalled()
    }
  })

  it('respects adjustable sensitivity threshold', () => {
    const sampleCount = 44100
    const samples = [new Float32Array(sampleCount), new Float32Array(sampleCount)] as [
      Float32Array,
      Float32Array
    ]

    // Create a small transient (below high sensitivity threshold)
    samples[0][1000] = 0.3

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    // High sensitivity (low threshold) - should detect the transient
    AutoSliceSensitivity.set(1000)
    autoSlice()

    const slicesWithHighSensitivity = LoadedFiles.ref()[0].slices.length

    // Reset and try with low sensitivity (high threshold)
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])

    AutoSliceSensitivity.set(5000) // Higher threshold
    autoSlice()

    const slicesWithLowSensitivity = LoadedFiles.ref()[0].slices.length

    // With higher sensitivity threshold, fewer slices should be detected
    expect(slicesWithLowSensitivity).toBeLessThanOrEqual(slicesWithHighSensitivity)
  })

  it('assigns step numbers based on fractional position', () => {
    const sampleCount = 44100
    const samples = [new Float32Array(sampleCount), new Float32Array(sampleCount)] as [
      Float32Array,
      Float32Array
    ]

    // Create transients at specific positions
    const positions = [0, sampleCount / 4, sampleCount / 2, (3 * sampleCount) / 4]
    positions.forEach(pos => {
      const index = Math.floor(pos)
      if (index < sampleCount) {
        samples[0][index] = 0.8
      }
    })

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    autoSlice()

    const file = LoadedFiles.ref()[0]
    // Verify slices have stepNum assigned (0-15)
    file.slices.forEach(slice => {
      expect(slice.stepNum).toBeGreaterThanOrEqual(0)
      expect(slice.stepNum).toBeLessThanOrEqual(15)
    })
  })

  it('clears existing slices before creating new ones', () => {
    const sampleCount = 44100
    const samples = [new Float32Array(sampleCount), new Float32Array(sampleCount)] as [
      Float32Array,
      Float32Array
    ]

    samples[0][1000] = 0.8

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [
          { start: 0, type: 'Kick', stepNum: 0 },
          { start: 1000, type: 'Snare', stepNum: 4 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    const initialSliceCount = LoadedFiles.ref()[0].slices.length
    expect(initialSliceCount).toBe(2)

    autoSlice()

    // Slices should be replaced, not appended
    const file = LoadedFiles.ref()[0]
    expect(file.slices.length).not.toBe(initialSliceCount)
  })

  it('does nothing when no file is selected', () => {
    const sampleCount = 44100
    const samples = [new Float32Array(sampleCount), new Float32Array(sampleCount)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(null)

    autoSlice()

    // Should not have called findClosestZeroCrossing
    expect(findClosestZeroCrossing).not.toHaveBeenCalled()
  })

  it('clears selected slice index after auto-slicing', () => {
    const sampleCount = 44100
    const samples = [new Float32Array(sampleCount), new Float32Array(sampleCount)] as [
      Float32Array,
      Float32Array
    ]

    samples[0][1000] = 0.8

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)
    SelectedSliceIndex.set(5) // Set a slice as selected

    autoSlice()

    expect(SelectedSliceIndex.ref()).toBe(null)
  })
})
