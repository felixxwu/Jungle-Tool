import type { LoadedFile } from '../lib/types'

export const getSliceIndexFromStepNum = (loadedFile: LoadedFile, stepNum: number) => {
  const index = loadedFile.slices.findIndex(slice => slice.stepNum === stepNum)
  if (index === -1) {
    return null
  }
  return index
}
