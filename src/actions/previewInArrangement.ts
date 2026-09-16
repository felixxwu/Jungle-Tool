import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'
import { Layers, LoadedFiles } from '../lib/store'

/**
 * Auditions a library file by hot-adding it as a temporary layer into the
 * live arrangement, so it plays in sync with the beat instead of stopping
 * playback for a one-shot preview. Replaces any previous temp layer.
 *
 * Clicking the break that's already the active temp preview registers
 * intent to keep it: it confirms in place by dropping the temp flag,
 * without needing to go through the separate "Add Layer" flow.
 */
export const previewInArrangement = (index: number) => {
  const loadedFiles = LoadedFiles.ref()
  const layerName = loadedFiles[index].name
  const current = Layers.ref()

  const existingTemp = current.find(l => l.temp)
  if (existingTemp && existingTemp.filename === layerName) {
    Layers.set(current.map(l => (l === existingTemp ? { ...l, temp: false } : l)))
    return
  }

  const layers = current.filter(l => !l.temp)
  if (layers.some(l => l.filename === layerName)) {
    Layers.set(layers)
    return
  }

  Layers.set([
    ...layers,
    {
      filename: layerName,
      volume: getBestLayerVolume(layerName),
      pitch: getBestLayerPitch(layerName),
      temp: true,
    },
  ])
}
