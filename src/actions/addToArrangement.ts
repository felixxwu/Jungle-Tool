import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'
import { Layers, LoadedFiles, Tab } from '../lib/store'

export const addToArrangement = (index: number) => {
  const loadedFiles = LoadedFiles.ref()

  Tab.set('arrangement')
  const layers = Layers.ref()
  const layerName = loadedFiles[index].name
  layers.push({
    filename: layerName,
    volume: getBestLayerVolume(layerName),
    pitch: getBestLayerPitch(layerName),
  })
  Layers.set([...layers])
}
