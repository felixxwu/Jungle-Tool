import { WaveFile } from 'wavefile'
import { LoadedFiles } from '../lib/store'
import { getSliceSamples } from './getSliceSamples'

const cache: { [key: string]: [Float32Array, Float32Array] } = {}

export const getPitchAdjustedSliceSamples = (p: {
  layerName: string
  sliceIndex: number
  layerPitch: number
}): [Float32Array, Float32Array] | null => {
  const loadedFiles = LoadedFiles.ref()
  const loadedFile = loadedFiles.find(file => file.name === p.layerName)
  if (!loadedFile) return null

  const slice = loadedFile.slices[p.sliceIndex]
  const nextSlice = loadedFile.slices[p.sliceIndex + 1]

  const cacheKey = JSON.stringify({
    ...p,
    sliceStart: slice.start,
    nextSliceStart: nextSlice?.start,
  })

  if (cache[cacheKey]) return cache[cacheKey] ?? null

  const sliceSamples = getSliceSamples(loadedFile, p.sliceIndex)

  const pitchMult = 1 / Math.pow(2, p.layerPitch / 12)

  const wav = new WaveFile()
  wav.fromScratch(2, 44100, '16', sliceSamples)
  wav.toSampleRate(44100 * pitchMult, { method: 'sinc' })
  const [left, right] = wav.getSamples() as unknown as [Float32Array, Float32Array]

  cache[cacheKey] = [left, right]

  return [left, right]
}
