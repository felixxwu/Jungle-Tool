import { mono } from '../lib/audio'
import {
  AutoSliceSensitivity,
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
} from '../lib/store'

export const autoSlice = () => {
  const loadedFiles = LoadedFiles.ref()
  const selectedFileIndex = SelectedFileIndex.ref()

  if (selectedFileIndex === null) return

  const selectedFile = loadedFiles[selectedFileIndex]
  const monoSamples = mono(selectedFile.samples)
  const transients = new Float64Array(monoSamples.length)
  let peakFollowerA = 0
  let peakFollowerB = 0
  const decay = 0.9995
  const peakOffset = 500
  const minTransientDistance = 3000

  for (let i = -peakOffset; i < monoSamples.length; i++) {
    peakFollowerA = Math.max(peakFollowerA, Math.abs(monoSamples[i] ?? 0))
    peakFollowerB = Math.max(peakFollowerB, Math.abs(monoSamples[i + peakOffset] ?? 0))

    peakFollowerA *= decay
    peakFollowerB *= decay

    transients[i] = peakFollowerB - peakFollowerA
  }

  selectedFile.slices = []

  for (let i = 0; i < transients.length; i++) {
    if (transients[i] > AutoSliceSensitivity.ref()) {
      selectedFile.slices.push({
        start: i + peakOffset,
        type: 'Kick',
      })
      i += minTransientDistance
    }
  }

  // selectedFile.samples = [transients, transients]
  LoadedFiles.set([...loadedFiles])
  SelectedSliceIndex.set(null)
}
