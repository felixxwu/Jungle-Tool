import { Arrangement, BPM, Layers, LoadedFiles, Swing } from '../lib/store'
import { getArrangementSamples } from '../helpers/getArrangementSamples'

export const useArrangementSamples = () => {
  const arrangement = Arrangement.useState()
  const loadedFiles = LoadedFiles.useState()
  const bpm = BPM.useState()
  const layers = Layers.useState()
  const swing = Swing.useState()

  return getArrangementSamples({ arrangement, loadedFiles, bpm, swing, layers })
}
