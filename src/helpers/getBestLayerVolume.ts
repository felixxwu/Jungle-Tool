import { mono } from '../lib/audio'
import { LoadedFiles, LowestRMS } from '../lib/store'
import { getRMS } from './getRMS'

export const getBestLayerVolume = (layerName: string) => {
  const loadedFiles = LoadedFiles.ref()
  const file = loadedFiles.find(f => f.name === layerName)
  if (!file) return 100

  const rms = getRMS(mono(file.samples))
  const multiplier = LowestRMS.ref() / rms

  return Math.round(100 * multiplier)
}
