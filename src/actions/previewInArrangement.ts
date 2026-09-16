import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'
import { Layers, LoadedFiles } from '../lib/store'

/**
 * Auditions a library file by hot-adding it as a temporary layer into the
 * live arrangement, so it plays in sync with the beat instead of stopping
 * playback for a one-shot preview. Replaces any previous temp layer.
 */
export const previewInArrangement = (index: number) => {
  const loadedFiles = LoadedFiles.ref()
  const layerName = loadedFiles[index].name

  const layers = Layers.ref().filter(l => !l.temp)
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
