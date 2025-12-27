import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSliceSamples } from './getSliceSamples'
import { stereoSlice } from '../lib/audio'
import type { LoadedFile } from '../lib/types'

// Mock audio helper
vi.mock('../lib/audio', () => ({
  stereoSlice: vi.fn((samples, start, end) => [
    samples[0].slice(start, end),
    samples[1].slice(start, end),
  ]),
}))

describe('getSliceSamples', () => {
  const mockFile: LoadedFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [
      new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      new Float32Array([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]),
    ] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Start', stepNum: 0 },
      { start: 2, type: 'Kick', stepNum: 0 },
      { start: 5, type: 'Snare', stepNum: 4 },
      { start: 8, type: 'End', stepNum: 0 },
    ],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts slice samples between current and next slice', () => {
    const result = getSliceSamples(mockFile, 1) // Kick slice (start: 2, next: 5)

    expect(stereoSlice).toHaveBeenCalledWith(mockFile.samples, 2, 5)
    expect(result).toEqual([new Float32Array([2, 3, 4]), new Float32Array([12, 13, 14])])
  })

  it('extracts slice samples to end of file if last slice', () => {
    const result = getSliceSamples(mockFile, 3) // End slice (start: 8, no next)

    expect(stereoSlice).toHaveBeenCalledWith(mockFile.samples, 8, mockFile.samples[0].length)
    expect(result).toEqual([new Float32Array([8, 9]), new Float32Array([18, 19])])
  })

  it('handles first slice', () => {
    const result = getSliceSamples(mockFile, 0) // Start slice (start: 0, next: 2)

    expect(stereoSlice).toHaveBeenCalledWith(mockFile.samples, 0, 2)
    expect(result).toEqual([new Float32Array([0, 1]), new Float32Array([10, 11])])
  })

  it('handles slice with no next slice at end of file', () => {
    const fileWithSingleSlice: LoadedFile = {
      ...mockFile,
      slices: [{ start: 3, type: 'Kick', stepNum: 0 }],
    }

    getSliceSamples(fileWithSingleSlice, 0)

    expect(stereoSlice).toHaveBeenCalledWith(
      fileWithSingleSlice.samples,
      3,
      fileWithSingleSlice.samples[0].length
    )
  })
})
