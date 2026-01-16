import { WaveFile } from 'wavefile'
import { LoadedFiles } from '../lib/store'
import { getSliceSamples } from './getSliceSamples'
import { SAMPLE_RATE } from '../lib/consts'

const cache: { [key: string]: [Float32Array, Float32Array] } = {}

export const getPitchAdjustedSliceSamples = (p: {
  layerName: string
  sliceIndex: number
  layerPitch: number
  noteLength: number
  noteFadeOut: number
  fillGaps: boolean
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
  wav.fromScratch(2, SAMPLE_RATE, '16', sliceSamples)
  wav.toSampleRate(SAMPLE_RATE * pitchMult, { method: 'sinc' })
  let [left, right] = wav.getSamples() as unknown as [Float32Array, Float32Array]

  if (p.fillGaps) {
    const reversedLeft = left.slice().reverse()
    const reversedRight = right.slice().reverse()
    left = new Float32Array([...left, ...reversedLeft])
    right = new Float32Array([...right, ...reversedRight])
  }

  const noteLengthInSamples = Math.round((p.noteLength / 1000) * SAMPLE_RATE)
  const fadeOutLengthInSamples = Math.round((p.noteFadeOut / 1000) * SAMPLE_RATE)
  for (let i = 0; i < left.length; i++) {
    if (i > noteLengthInSamples) {
      const fadeOutProgress = (i - noteLengthInSamples) / fadeOutLengthInSamples
      const fadeOutMultiplier = Math.max(0, 1 - fadeOutProgress)
      left[i] *= fadeOutMultiplier
      right[i] *= fadeOutMultiplier
    }
  }

  cache[cacheKey] = [left, right]

  return [left, right]
}
