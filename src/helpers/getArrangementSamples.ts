import { normalize, sineSaturationStereo, stereoSlice } from '../lib/audio'
import { BPM, Layers, NumBars, Saturation } from '../lib/store'
import { getArrangementLayerSamples } from './getArrangementLayerSamples'
import { max } from './max'

export const getArrangementSamples = (p: { bar?: number }) => {
  const bpm = BPM.ref()
  const layers = Layers.ref()
  const numBars = NumBars.ref()
  const saturation = Saturation.ref()
  const numberOfBarsToPlay = p.bar === undefined ? numBars : 1

  const stepSize = (60 / bpm / 4) * 44100
  const waveformLengthInSamples = Math.round(stepSize * 16 * numberOfBarsToPlay)
  const arrangementSamples = stereoSlice(
    [new Float32Array(0), new Float32Array(0)],
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

  let normalisedSamples = arrangementSamples

  const peakLeft = max(arrangementSamples[0])
  const peakRight = max(arrangementSamples[1])
  if (peakLeft > Math.pow(2, 15) || peakRight > Math.pow(2, 15)) {
    normalisedSamples = normalize(arrangementSamples)
  }

  const mix = Math.min(saturation * 2, 100)
  const preGain = saturation < 50 ? 0 : ((saturation - 50) / 50) * 12

  return sineSaturationStereo(normalisedSamples, mix, preGain)
}
