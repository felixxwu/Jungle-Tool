import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { useArrangementStates } from './useArrangementStates'

export const useArrangementSamples = (p: { bar?: number }) => {
  useArrangementStates()

  return getArrangementSamples({ bar: p.bar })
}
