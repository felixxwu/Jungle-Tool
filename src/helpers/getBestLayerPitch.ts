import { BPM, LoadedFiles, Swing } from '../lib/store'

const getSwingOffset = (index: number) => {
  const bpm = BPM.ref()
  const stepSizeInSamples = ((60 / bpm) * 44100) / 4
  if (index % 2 === 1) return 0
  return (Swing.ref() / 100) * stepSizeInSamples
}

export const getBestLayerPitch = (layerName: string) => {
  const bpm = BPM.ref()
  const stepSizeInSamples = ((60 / bpm) * 44100) / 4
  const loadedFiles = LoadedFiles.ref()
  const file = loadedFiles.find(f => f.name === layerName)
  if (!file) return 0

  const pitchMults = file.slices.map((s, i) => {
    const nextSliceStart = file.slices[i + 1]?.start || file.samples[0].length
    const sliceLength = nextSliceStart - s.start
    const swungStepSize =
      stepSizeInSamples + getSwingOffset(s.stepNum) - getSwingOffset(s.stepNum + 1)

    return swungStepSize / sliceLength
  })
  const pitchMult = Math.max(...pitchMults)
  const pitchShift = 12 * Math.log2(1 / pitchMult)
  return Math.ceil(pitchShift)
}
