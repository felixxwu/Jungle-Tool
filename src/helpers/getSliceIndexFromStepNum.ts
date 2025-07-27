import type { LoadedFile } from '../lib/types'

export const getSliceIndexFromStepNum = (loadedFile: LoadedFile, stepNum: number) => {
  const expectedSliceStart = Math.round((stepNum / 16) * loadedFile.samples[0].length)
  const expectedStepSize = loadedFile.samples[0].length / 16
  let closestSliceIndex = 0
  let closestSliceDistance = Infinity

  for (let i = 0; i < loadedFile.slices.length; i++) {
    const slice = loadedFile.slices[i]
    const distanceFromExpectedSliceStart = Math.abs(slice.start - expectedSliceStart)
    if (distanceFromExpectedSliceStart < closestSliceDistance) {
      closestSliceDistance = distanceFromExpectedSliceStart
      closestSliceIndex = i
    }
  }

  if (closestSliceDistance > expectedStepSize / 2) {
    return null
  }

  return closestSliceIndex
}
