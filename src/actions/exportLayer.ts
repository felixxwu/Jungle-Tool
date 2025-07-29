import { getArrangementLayerSamples } from '../helpers/getArrangementLayerSamples'
import { Arrangement, BPM, LoadedFiles, Swing } from '../lib/store'
import type { Layer } from '../lib/types'
import { downloadAsWav } from './downloadAsWav'

export const exportLayer = (layer: Layer) => {
  const layerSamples = getArrangementLayerSamples({
    arrangement: Arrangement.ref(),
    loadedFiles: LoadedFiles.ref(),
    bpm: BPM.ref(),
    swing: Swing.ref(),
    layer,
  })

  if (!layerSamples) return

  downloadAsWav(layerSamples, `Jungle Tool Break (${layer.filename})`)
}
