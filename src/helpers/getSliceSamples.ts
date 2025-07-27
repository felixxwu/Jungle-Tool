import { stereoSlice } from '../lib/audio'
import type { LoadedFile } from '../lib/types'

export const getSliceSamples = (loadedFile: LoadedFile, sliceIndex: number) => {
  const slice = loadedFile.slices[sliceIndex]
  const nextSlice = loadedFile.slices[sliceIndex + 1]
  const sliceStart = slice.start
  const sliceEnd = nextSlice ? nextSlice.start : loadedFile.samples[0].length
  return stereoSlice(loadedFile.samples, sliceStart, sliceEnd)
}
