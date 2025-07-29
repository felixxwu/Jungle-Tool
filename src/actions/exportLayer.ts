import { getArrangementLayerSamples } from '../helpers/getArrangementLayerSamples'
import type { Layer } from '../lib/types'
import { downloadAsWav } from './downloadAsWav'

export const exportLayer = (layer: Layer) => {
  const layerSamples = getArrangementLayerSamples({ layer })

  if (!layerSamples) return

  downloadAsWav(layerSamples, `Jungle Tool Break - ${layer.filename}`)
}
