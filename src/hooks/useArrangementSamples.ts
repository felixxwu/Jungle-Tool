import { Arrangement, BPM, Layers, LoadedFiles, NumBars, Swing } from '../lib/store'
import { getArrangementSamples } from '../helpers/getArrangementSamples'

export const useArrangementSamples = (p: { bar?: number }) => {
  Arrangement.useState()
  LoadedFiles.useState()
  BPM.useState()
  Layers.useState()
  Swing.useState()
  NumBars.useState()

  return getArrangementSamples({ bar: p.bar })
}
