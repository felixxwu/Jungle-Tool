import { ReplaceLayerIndex, ReplaceOriginalLayer, Tab } from '../lib/store'

export const confirmReplace = () => {
  ReplaceLayerIndex.set(null)
  ReplaceOriginalLayer.set(null)
  Tab.set('arrangement')
}
