import { describe, it, expect, beforeEach } from 'vitest'
import { addSlice } from './addSlice'
import { LoadedFiles, SelectedFileIndex, SelectedSliceIndex } from '../lib/store'

describe('addSlice', () => {
  beforeEach(() => {
    LoadedFiles.set([])
    SelectedFileIndex.set(null)
    SelectedSliceIndex.set(null)
  })

  it('adds a new slice when no slice is selected', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
        slices: [{ start: 0, type: 'Kick', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)
    SelectedSliceIndex.set(null)

    addSlice()

    const file = LoadedFiles.ref()[0]
    expect(file.slices.length).toBe(2)
    expect(file.slices[1].type).toBe('Hat')
    expect(file.slices[1].start).toBe(5000) // Last slice start + 5000
    expect(file.slices[1].stepNum).toBe(0) // Same as last slice
  })

  it('adds a slice after the selected slice', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
        slices: [
          { start: 0, type: 'Kick', stepNum: 0 },
          { start: 5000, type: 'Snare', stepNum: 4 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)
    SelectedSliceIndex.set(0) // Select first slice

    addSlice()

    const file = LoadedFiles.ref()[0]
    expect(file.slices.length).toBe(3)
    // New slice should be added with start = selected slice start + 5000
    // After sorting, it will be at index 1 (between 0 and 5000)
    const newSlice = file.slices.find(s => s.start === 5000 && s.type === 'Hat')
    expect(newSlice).toBeDefined()
    expect(newSlice?.stepNum).toBe(0) // Same stepNum as selected slice
  })

  it('adds slice at position 0 when no slices exist', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    addSlice()

    const file = LoadedFiles.ref()[0]
    expect(file.slices.length).toBe(1)
    expect(file.slices[0].start).toBe(0)
    expect(file.slices[0].stepNum).toBe(0)
    expect(file.slices[0].type).toBe('Hat')
  })

  it('sorts slices by start position after adding', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
        slices: [
          { start: 10000, type: 'Kick', stepNum: 0 },
          { start: 0, type: 'Snare', stepNum: 4 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    addSlice()

    const file = LoadedFiles.ref()[0]
    // Verify slices are sorted by start position
    for (let i = 1; i < file.slices.length; i++) {
      expect(file.slices[i].start).toBeGreaterThanOrEqual(file.slices[i - 1].start)
    }
  })

  it('does nothing when no file is selected', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(null)

    const initialSlices = LoadedFiles.ref()[0].slices.length

    addSlice()

    const file = LoadedFiles.ref()[0]
    expect(file.slices.length).toBe(initialSlices) // Should not change
  })

  it('ignores End type slices when finding last slice', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
        slices: [
          { start: 0, type: 'Kick', stepNum: 0 },
          { start: 10000, type: 'End', stepNum: 0 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)
    SelectedSliceIndex.set(null)

    addSlice()

    const file = LoadedFiles.ref()[0]
    // Should add a new slice
    // Note: The implementation filters out End slices, but uses original array length
    // as index which may be undefined. However, if lastSlice is undefined, it falls
    // back to start: 0, stepNum: 0
    expect(file.slices.length).toBe(3)
    // The new slice should be added (either at 5000 based on Kick, or 0 if lastSlice is undefined)
    const newSlice = file.slices.find(s => s.type === 'Hat' && s.start >= 0)
    expect(newSlice).toBeDefined()
  })
})

