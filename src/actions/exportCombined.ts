import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import { downloadAsWav } from './downloadAsWav'

export const exportCombined = async () => {
  const buffer = await renderOffline()
  downloadAsWav(audioBufferToSamples(buffer), 'Jungle Tool Break')
}
