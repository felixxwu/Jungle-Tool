import { normalize, stereoSlice } from '../lib/audio'
import { Arrangement, BPM, Layers, LoadedFiles, type Swing } from '../lib/store'
import { getArrangementLayerSamples } from './getArrangementLayerSamples'
import { max } from './max'

export const getArrangementSamples = (p: {
  arrangement: ReturnType<typeof Arrangement.ref>
  loadedFiles: ReturnType<typeof LoadedFiles.ref>
  bpm: ReturnType<typeof BPM.ref>
  swing: ReturnType<typeof Swing.ref>
  layers: ReturnType<typeof Layers.ref>
}) => {
  const stepSize = (60 / p.bpm / 4) * 44100
  const waveformLengthInSamples = Math.round(stepSize * 16)
  const arrangementSamples = stereoSlice(
    [new Float64Array(0), new Float64Array(0)],
    0,
    waveformLengthInSamples
  )

  for (const layer of p.layers) {
    const layerSamples = getArrangementLayerSamples({
      arrangement: p.arrangement,
      loadedFiles: p.loadedFiles,
      bpm: p.bpm,
      swing: p.swing,
      layer,
    })

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
