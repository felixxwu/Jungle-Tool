import { WaveFile } from 'wavefile'
import { stereoSlice } from '../lib/audio'
import { Swing, type Arrangement, type BPM, type LoadedFiles } from '../lib/store'
import type { Layer } from '../lib/types'
import { getSliceIndexFromStepNum } from './getSliceIndexFromStepNum'
import { getSliceSamples } from './getSliceSamples'

export const getArrangementLayerSamples = (p: {
  arrangement: ReturnType<typeof Arrangement.ref>
  loadedFiles: ReturnType<typeof LoadedFiles.ref>
  bpm: ReturnType<typeof BPM.ref>
  swing: ReturnType<typeof Swing.ref>
  layer: Layer
}) => {
  const stepSize = (60 / p.bpm / 4) * 44100

  const getSwingOffset = (index: number) => {
    if (index % 2 === 0) return 0
    return (p.swing / 100) * stepSize
  }

  const firstLoadedFile = p.loadedFiles.find(file => file.name === p.layer.filename)
  if (!firstLoadedFile) return null

  const waveformLengthInSamples = Math.round(stepSize * 16)
  const currentLayer = stereoSlice(
    [new Float64Array(0), new Float64Array(0)],
    0,
    waveformLengthInSamples
  )

  p.arrangement.sort((a, b) => a.startStep - b.startStep)

  for (const note of p.arrangement) {
    const sliceIndex = getSliceIndexFromStepNum(firstLoadedFile, note.stepNumToPlay)
    if (sliceIndex === null) continue

    const sliceSamples = getSliceSamples(firstLoadedFile, sliceIndex)

    const pitchMult = 1 / Math.pow(2, p.layer.pitch / 12)

    const wavLeft = new WaveFile()
    wavLeft.fromScratch(1, 44100, '16', sliceSamples[0])
    wavLeft.toSampleRate(44100 * pitchMult, { method: 'sinc' })
    const newLeft = wavLeft.getSamples()

    const wavRight = new WaveFile()
    wavRight.fromScratch(1, 44100, '16', sliceSamples[1])
    wavRight.toSampleRate(44100 * pitchMult, { method: 'sinc' })
    const newRight = wavRight.getSamples()

    for (let i = 0; i < newLeft.length; i++) {
      const offset = Math.round(stepSize * note.startStep + getSwingOffset(note.stepNumToPlay))
      currentLayer[0][i + offset] = newLeft[i] * (p.layer.volume / 100)
      currentLayer[1][i + offset] = newRight[i] * (p.layer.volume / 100)
    }
  }

  return currentLayer
}
