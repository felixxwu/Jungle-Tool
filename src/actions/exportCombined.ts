import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import { downloadAsWav } from './downloadAsWav'

export const exportCombined = async (p?: { saturation?: number; swing?: number }) => {
  const buffer = await renderOffline(p)
  downloadAsWav(audioBufferToSamples(buffer), 'Jungle Tool Break')
}
