import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { downloadAsWav } from './downloadAsWav'

export const exportCombined = () => {
  const arrangementSamples = getArrangementSamples({})

  downloadAsWav(arrangementSamples, 'Jungle Tool Break')
}
