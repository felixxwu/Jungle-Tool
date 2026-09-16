import { getSliceSamples } from '../helpers/getSliceSamples'
import { SAMPLE_RATE } from './consts'
import type { LoadedFile } from './types'

const SAMPLE_SCALE = 2 ** 15

const cache: { [key: string]: AudioBuffer } = {}

export const clearSliceBufferCache = () => {
  for (const key of Object.keys(cache)) delete cache[key]
}

export const getSliceBuffer = (p: {
  ctx: BaseAudioContext
  loadedFile: LoadedFile
  sliceIndex: number
  fillGaps: boolean
}) => {
  const slice = p.loadedFile.slices[p.sliceIndex]
  const nextSlice = p.loadedFile.slices[p.sliceIndex + 1]

  // Slice boundaries are editable at runtime (updateSliceStart, addSlice,
  // autoSlice), so they have to be part of the key or we serve stale audio.
  const key = [p.loadedFile.name, p.sliceIndex, slice.start, nextSlice?.start, p.fillGaps].join('|')
  if (cache[key]) return cache[key]

  const [left, right] = getSliceSamples(p.loadedFile, p.sliceIndex)
  const frames = p.fillGaps ? left.length * 2 : left.length
  const buffer = p.ctx.createBuffer(2, frames, SAMPLE_RATE)

  for (const [channel, samples] of [left, right].entries()) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < samples.length; i++) data[i] = samples[i] / SAMPLE_SCALE
    // Fill Gaps: append the slice reversed so a pitched-up (shortened) slice
    // runs seamlessly into the next step instead of leaving silence.
    if (p.fillGaps) {
      for (let i = 0; i < samples.length; i++) {
        data[samples.length + i] = samples[samples.length - 1 - i] / SAMPLE_SCALE
      }
    }
  }

  cache[key] = buffer
  return buffer
}
