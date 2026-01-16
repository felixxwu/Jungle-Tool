import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'
import { Layers, LoadedFiles } from '../lib/store'
import { playArrangement } from './playArrangement'

export const randomiseLayers = async () => {
  const savedLayers = [...Layers.ref()]
  Layers.set([])

  await new Promise(r => setTimeout(r))

  const loadedFiles = LoadedFiles.ref()
  for (let i = 0; i < savedLayers.length; i++) {
    const takenLayers = savedLayers.slice(0, i).map(l => l.filename.split('(')[0])
    const remainingFiles = loadedFiles.filter(
      f => !takenLayers.includes(f.name.split('(')[0]) && f.name !== 'PH Break'
    )
    const randomFile = remainingFiles[Math.floor(Math.random() * remainingFiles.length)]
    savedLayers[i].filename = randomFile.name
  }

  for (const layer of savedLayers) {
    layer.pitch = getBestLayerPitch(layer.filename)
    layer.volume = getBestLayerVolume(layer.filename)
  }

  Layers.set([...savedLayers])
  await new Promise(r => setTimeout(r))
  await playArrangement()
}
