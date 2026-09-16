import { describe, it, expect, beforeEach } from 'vitest'
import { getSliceBuffer, clearSliceBufferCache } from './audioBuffers'
import { createFakeAudioContext } from '../test/audio-mock'
import type { LoadedFile } from './types'

const makeFile = (sliceStarts: number[]): LoadedFile => ({
  name: 'Test Break',
  artist: 'Test',
  year: 1969,
  samples: [
    Float32Array.from({ length: 8 }, (_, i) => (i + 1) * 1000),
    Float32Array.from({ length: 8 }, (_, i) => (i + 1) * 1000),
  ],
  slices: sliceStarts.map(start => ({ start, type: 'Kick' as const, stepNum: 0 })),
  whosampledLink: '',
  whosampledCount: 0,
})

describe('getSliceBuffer', () => {
  beforeEach(() => clearSliceBufferCache())

  it('scales 16-bit sample values into the -1..1 range', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const buffer = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    expect(buffer.length).toBe(4)
    expect(buffer.getChannelData(0)[0]).toBeCloseTo(1000 / 2 ** 15, 6)
  })

  it('doubles the length and mirrors the tail when fillGaps is on', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const buffer = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: true })
    expect(buffer.length).toBe(8)
    const data = buffer.getChannelData(0)
    expect(data[4]).toBeCloseTo(data[3], 6)
    expect(data[7]).toBeCloseTo(data[0], 6)
  })

  it('returns the identical buffer for a repeated call', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const first = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    const second = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    expect(second).toBe(first)
  })

  it('does not serve a stale buffer after a slice boundary moves', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const before = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    file.slices[1].start = 6
    const after = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    expect(after).not.toBe(before)
    expect(after.length).toBe(6)
  })
})
