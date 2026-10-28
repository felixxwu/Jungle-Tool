import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'
import { isUntrimmed } from '../helpers/isUntrimmed'
import { Layers, LoadedFiles } from '../lib/store'
import { confirmReplace } from './confirmReplace'

/**
 * Previews a candidate replacement by hot-swapping it live into the target
 * layer's slot, so it can be inspected/heard in the mix before committing.
 * Clicking the break that's already previewing in that slot confirms it.
 */
export const replaceInArrangement = (targetIndex: number, fileIndex: number) => {
  const loadedFiles = LoadedFiles.ref()
  if (isUntrimmed(loadedFiles[fileIndex])) return
  const layerName = loadedFiles[fileIndex].name

  const layers = Layers.ref()
  if (targetIndex < 0 || targetIndex >= layers.length) return

  if (layers[targetIndex].filename === layerName) {
    confirmReplace()
    return
  }

  const newLayers = [...layers]
  newLayers[targetIndex] = {
    filename: layerName,
    volume: getBestLayerVolume(layerName),
    pitch: getBestLayerPitch(layerName),
  }
  Layers.set(newLayers)
}
