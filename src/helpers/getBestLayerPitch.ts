import { BPM, LoadedFiles, Swing } from '../lib/store'
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

  const sortedSlices = [...file.slices].sort((a, b) => a.stepNum - b.stepNum)
  const pitchMults = sortedSlices.map((s, i) => {
    const nextSliceStart = sortedSlices[i + 1]?.start || file.samples[0].length
    const sliceLengthInSamples = nextSliceStart - s.start
    const nextSliceStepNum = sortedSlices[i + 1]?.stepNum || 16
    const sliceLengthInSteps = nextSliceStepNum - s.stepNum
    const swungStepSize =
      getSwungStepSize(s.stepNum) + (sliceLengthInSteps === 2 ? getSwungStepSize(s.stepNum + 1) : 0)

    return swungStepSize / sliceLengthInSamples
  })
  const pitchMult = Math.max(...pitchMults)
  const pitchShift = 12 * Math.log2(1 / pitchMult)
  return Math.max(0, Math.ceil(pitchShift))
}
