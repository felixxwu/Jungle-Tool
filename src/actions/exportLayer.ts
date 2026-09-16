import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import type { Layer } from '../lib/types'
import { downloadAsWav } from './downloadAsWav'

export const exportLayer = async (layer: Layer) => {
  const buffer = await renderOffline({ layers: [layer] })
  downloadAsWav(audioBufferToSamples(buffer), `Jungle Tool Break - ${layer.filename}`)
}
