import { Arrangement, BPM, Layers, LoadedFiles } from '../lib/store'
import { getArrangementSamples } from '../helpers/getArrangementSamples'

export const useArrangementSamples = () => {
  const arrangement = Arrangement.useState()
  const loadedFiles = LoadedFiles.useState()
  const bpm = BPM.useState()
  const layers = Layers.useState()

  return getArrangementSamples({ arrangement, loadedFiles, bpm, layers })
}
