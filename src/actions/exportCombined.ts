import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { Arrangement, BPM, Layers, LoadedFiles, Swing } from '../lib/store'
import { downloadAsWav } from './downloadAsWav'

export const exportCombined = () => {
  const arrangementSamples = getArrangementSamples({
    arrangement: Arrangement.ref(),
    loadedFiles: LoadedFiles.ref(),
    bpm: BPM.ref(),
    swing: Swing.ref(),
    layers: Layers.ref(),
  })

  downloadAsWav(arrangementSamples, 'Jungle Tool Break')
}
