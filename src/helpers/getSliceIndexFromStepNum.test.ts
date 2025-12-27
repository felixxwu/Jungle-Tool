import { describe, it, expect } from 'vitest'
import { getSliceIndexFromStepNum } from './getSliceIndexFromStepNum'
import type { LoadedFile } from '../lib/types'

describe('getSliceIndexFromStepNum', () => {
  const mockFile: LoadedFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(1000), new Float32Array(1000)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Kick', stepNum: 0 },
      { start: 100, type: 'Hat', stepNum: 2 },
      { start: 200, type: 'Snare', stepNum: 4 },
      { start: 300, type: 'Hat', stepNum: 6 },
    ],
    whosampledLink: '',
    whosampledCount: 0,
  }

  it('finds slice index for existing step number', () => {
    expect(getSliceIndexFromStepNum(mockFile, 0)).toBe(0)
    expect(getSliceIndexFromStepNum(mockFile, 2)).toBe(1)
    expect(getSliceIndexFromStepNum(mockFile, 4)).toBe(2)
    expect(getSliceIndexFromStepNum(mockFile, 6)).toBe(3)
  })

  it('returns null for non-existent step number', () => {
    expect(getSliceIndexFromStepNum(mockFile, 1)).toBe(null)
    expect(getSliceIndexFromStepNum(mockFile, 3)).toBe(null)
    expect(getSliceIndexFromStepNum(mockFile, 5)).toBe(null)
    expect(getSliceIndexFromStepNum(mockFile, 10)).toBe(null)
  })

  it('handles file with no slices', () => {
    const emptyFile: LoadedFile = {
      ...mockFile,
      slices: [],
    }
    expect(getSliceIndexFromStepNum(emptyFile, 0)).toBe(null)
  })

  it('handles file with single slice', () => {
    const singleSliceFile: LoadedFile = {
      ...mockFile,
      slices: [{ start: 0, type: 'Kick', stepNum: 0 }],
    }
    expect(getSliceIndexFromStepNum(singleSliceFile, 0)).toBe(0)
    expect(getSliceIndexFromStepNum(singleSliceFile, 1)).toBe(null)
  })

  it('finds first matching slice if multiple slices have same stepNum', () => {
    const fileWithDuplicates: LoadedFile = {
      ...mockFile,
      slices: [
        { start: 0, type: 'Kick', stepNum: 0 },
        { start: 100, type: 'Hat', stepNum: 0 },
        { start: 200, type: 'Snare', stepNum: 4 },
      ],
    }
    // Should return index of first slice with stepNum 0
    expect(getSliceIndexFromStepNum(fileWithDuplicates, 0)).toBe(0)
  })
})

