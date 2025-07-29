import { normalize, stereoSlice } from '../lib/audio'
import { BPM, Layers, NumBars } from '../lib/store'
import { getArrangementLayerSamples } from './getArrangementLayerSamples'
import { max } from './max'

export const getArrangementSamples = (p: { bar?: number }) => {
  const bpm = BPM.ref()
  const layers = Layers.ref()
  const numBars = NumBars.ref()
  const numberOfBarsToPlay = p.bar === undefined ? numBars : 1

  const stepSize = (60 / bpm / 4) * 44100
  const waveformLengthInSamples = Math.round(stepSize * 16 * numberOfBarsToPlay)
  const arrangementSamples = stereoSlice(
    [new Float64Array(0), new Float64Array(0)],
    0,
    waveformLengthInSamples
  )

  for (const layer of layers) {
    const layerSamples = getArrangementLayerSamples({ layer, bar: p.bar })

    if (!layerSamples) continue

    for (let i = 0; i < layerSamples[0].length; i++) {
      arrangementSamples[0][i] += layerSamples[0][i]
      arrangementSamples[1][i] += layerSamples[1][i]
    }
  }

  const peakLeft = max(arrangementSamples[0])
  const peakRight = max(arrangementSamples[1])
  if (peakLeft > Math.pow(2, 15) || peakRight > Math.pow(2, 15)) {
    return normalize(arrangementSamples)
  }

  return arrangementSamples
}
