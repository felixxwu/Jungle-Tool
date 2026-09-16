import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import { Layers } from '../lib/store'
import { downloadAsWav } from './downloadAsWav'

export const exportCombined = async (p?: { saturation?: number; swing?: number }) => {
  const buffer = await renderOffline(p)
  const breakNames = Layers.ref()
    .map(layer => layer.filename)
    .join(', ')
  downloadAsWav(audioBufferToSamples(buffer), `${breakNames} (Jungle Tool)`)
}
