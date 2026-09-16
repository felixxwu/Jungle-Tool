import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import type { Layer } from '../lib/types'
import { downloadAsWav } from './downloadAsWav'

export const exportLayer = async (
  layer: Layer,
  p?: { saturation?: number; swing?: number }
) => {
  const buffer = await renderOffline({ ...p, layers: [layer] })
  downloadAsWav(audioBufferToSamples(buffer), `Jungle Tool Break - ${layer.filename}`)
}
