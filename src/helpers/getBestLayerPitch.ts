import { maxPitch } from '../lib/consts'
import { BPM, LoadedFiles, Swing } from '../lib/store'
import { getSliceIndexFromStepNum } from './getSliceIndexFromStepNum'
import { getStepSize } from './getStepSize'

const getSwungStepSize = (index: number) => {
  const bpm = BPM.ref()
  const stepSizeInSamples = getStepSize(bpm)
  if (index % 2 === 1) {
    return stepSizeInSamples - (Swing.ref() / 100) * stepSizeInSamples
  } else {
    return stepSizeInSamples + (Swing.ref() / 100) * stepSizeInSamples
  }
}

export const getBestLayerPitch = (layerName: string) => {
  const loadedFiles = LoadedFiles.ref()
  const file = loadedFiles.find(f => f.name === layerName)
  if (!file) return 0

  // Only the first slice at each stepNum is ever played, so duplicates (an
  // import's Start/End pair) must not count as slices of their own.
  const stepNums = [...new Set(file.slices.map(s => s.stepNum))].sort((a, b) => a - b)
  const pitchMults = stepNums.map((stepNum, i) => {
    const sliceIndex = getSliceIndexFromStepNum(file, stepNum)!
    // Same end point getSliceSamples plays to.
    const sliceEnd = file.slices[sliceIndex + 1]?.start ?? file.samples[0].length
    const sliceLengthInSamples = sliceEnd - file.slices[sliceIndex].start
    const nextStepNum = stepNums[i + 1] ?? 16
    let swungStepSize = 0
    for (let step = stepNum; step < nextStepNum; step++) swungStepSize += getSwungStepSize(step)

    return swungStepSize / sliceLengthInSamples
  })
  const pitchMult = Math.max(...pitchMults)
  const pitchShift = 12 * Math.log2(1 / pitchMult)
  return Math.min(maxPitch, Math.max(0, Math.ceil(pitchShift)))
}
