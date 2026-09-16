import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'
import { Layers, LoadedFiles, Tab } from '../lib/store'

export const addToArrangement = (index: number) => {
  const loadedFiles = LoadedFiles.ref()
  const layerName = loadedFiles[index].name

  const layers = Layers.ref()
  const existingTemp = layers.find(l => l.filename === layerName && l.temp)

  if (existingTemp) {
    Layers.set(layers.map(l => (l === existingTemp ? { ...l, temp: false } : l)))
  } else {
    Layers.set([
      ...layers,
      {
        filename: layerName,
        volume: getBestLayerVolume(layerName),
        pitch: getBestLayerPitch(layerName),
      },
    ])
  }

  Tab.set('arrangement')
}
