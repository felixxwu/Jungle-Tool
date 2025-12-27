import { describe, it, expect, beforeEach, vi } from 'vitest'
import { updateSliceStart } from './updateSliceStart'
import { LoadedFiles, SelectedFileIndex } from '../lib/store'
import { findClosestZeroCrossing } from '../helpers/findClosestZeroCrossing'
import { playSlice } from './playSlice'
import { playTrim } from './playTrim'

// Mock dependencies
vi.mock('../helpers/findClosestZeroCrossing', () => ({
  findClosestZeroCrossing: vi.fn((_samples: Float32Array, start: number) => start),
}))

vi.mock('../lib/audio', () => ({
  mono: vi.fn((samples: [Float32Array, Float32Array]) => samples[0]),
}))

vi.mock('./playSlice', () => ({
  playSlice: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./playTrim', () => ({
  playTrim: vi.fn().mockResolvedValue(undefined),
}))

describe('updateSliceStart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([])
    SelectedFileIndex.set(null)
  })

  it('updates slice start position using zero-crossing detection', async () => {
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'Kick', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    await updateSliceStart(2000, 0, 'bidirectional')

    const file = LoadedFiles.ref()[0]
    expect(file.slices[0].start).toBe(2000) // Should be updated to the zero-crossing position
    expect(findClosestZeroCrossing).toHaveBeenCalled()
  })

  it('uses forward search direction when specified', async () => {
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'Kick', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    await updateSliceStart(2000, 0, 'forward')

    expect(findClosestZeroCrossing).toHaveBeenCalledWith(expect.any(Float32Array), 2000, 'forward')
  })

  it('uses backward search direction when specified', async () => {
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'Kick', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    await updateSliceStart(2000, 0, 'backward')

    expect(findClosestZeroCrossing).toHaveBeenCalledWith(expect.any(Float32Array), 2000, 'backward')
  })

  it('defaults to bidirectional search when no direction specified', async () => {
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'Kick', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    await updateSliceStart(2000, 0)

    expect(findClosestZeroCrossing).toHaveBeenCalledWith(
      expect.any(Float32Array),
      2000,
      'bidirectional'
    )
  })

  it('plays slice after updating non-trimmer slice', async () => {
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'Kick', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    await updateSliceStart(2000, 0)

    expect(playSlice).toHaveBeenCalledWith(0, 0)
    expect(playTrim).not.toHaveBeenCalled()
  })

  it('plays trim after updating Start type slice', async () => {
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'Start', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    await updateSliceStart(2000, 0)

    expect(playTrim).toHaveBeenCalledWith(0)
    expect(playSlice).not.toHaveBeenCalled()
  })

  it('plays trim after updating End type slice', async () => {
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'End', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    await updateSliceStart(2000, 0)

    expect(playTrim).toHaveBeenCalledWith(0)
    expect(playSlice).not.toHaveBeenCalled()
  })

  it('does nothing when no file is selected', async () => {
    vi.clearAllMocks()
    const samples = [new Float32Array(44100), new Float32Array(44100)] as [
      Float32Array,
      Float32Array
    ]

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples,
        slices: [{ start: 1000, type: 'Kick', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(null)

    await updateSliceStart(2000, 0)

    expect(findClosestZeroCrossing).not.toHaveBeenCalled()
    expect(playSlice).not.toHaveBeenCalled()
    expect(playTrim).not.toHaveBeenCalled()
  })
})
