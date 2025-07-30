import { stereoSlice } from '../lib/audio'
import { Swing, Arrangement, BPM, LoadedFiles, NumBars } from '../lib/store'
import type { Layer } from '../lib/types'
import { getSliceIndexFromStepNum } from './getSliceIndexFromStepNum'
import { getPitchAdjustedSliceSamples } from './getPitchAdjustedSliceSamples'

export const getArrangementLayerSamples = (p: { layer: Layer; bar?: number }) => {
  const arrangement = Arrangement.ref()
  const loadedFiles = LoadedFiles.ref()
  const bpm = BPM.ref()
  const swing = Swing.ref()
  const numBars = NumBars.ref()
  const numberOfBarsToPlay = p.bar === undefined ? numBars : 1

  const stepSize = (60 / bpm / 4) * 44100

  const getSwingOffset = (index: number) => {
    if (index % 2 === 0) return 0
    return (swing / 100) * stepSize
  }

  const firstLoadedFile = loadedFiles.find(file => file.name === p.layer.filename)
  if (!firstLoadedFile) return null

  const waveformLengthInSamples = Math.round(stepSize * 16 * numberOfBarsToPlay)
  const currentLayer = stereoSlice(
    [new Float32Array(0), new Float32Array(0)],
    0,
    waveformLengthInSamples
  )

  arrangement.sort((a, b) => a.startStep - b.startStep)

  for (const note of arrangement) {
    if (p.bar !== undefined && note.startStep < p.bar * 16) continue
    if (p.bar !== undefined && note.startStep > (p.bar + 1) * 16) continue

    const relativeStartStep = note.startStep - (p.bar ?? 0) * 16

    const sliceIndex = getSliceIndexFromStepNum(firstLoadedFile, note.stepNumToPlay)
    if (sliceIndex === null) continue

    const samples = getPitchAdjustedSliceSamples({
      layerName: p.layer.filename,
      sliceIndex,
      layerPitch: p.layer.pitch,
    })

    if (!samples) continue

    const [left, right] = samples

    for (let i = 0; i < left.length; i++) {
      const offset = Math.round(stepSize * relativeStartStep + getSwingOffset(note.startStep))
      currentLayer[0][i + offset] = left[i] * (p.layer.volume / 100)
      currentLayer[1][i + offset] = right[i] * (p.layer.volume / 100)
    }
  }
  return currentLayer
}
