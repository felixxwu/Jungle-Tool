import { findClosestZeroCrossing } from '../helpers/findClosestZeroCrossing'
import { mono } from '../lib/audio'
import { LoadedFiles, SelectedFileIndex } from '../lib/store'
import type { ZeroCrossingSearch } from '../lib/types'
import { playSlice } from './playSlice'
import { playTrim } from './playTrim'

export const updateSliceStart = async (
  start: number,
  sliceIndex: number,
  zeroCrossingSearch: ZeroCrossingSearch = 'bidirectional'
) => {
  const selectedFileIndex = SelectedFileIndex.ref()
  if (selectedFileIndex === null) return

  const newLoadedFiles = [...LoadedFiles.ref()]
  const selectedFile = newLoadedFiles[selectedFileIndex]
  const slice = selectedFile.slices[sliceIndex]
  const monoSamples = mono(selectedFile.samples)

  slice.start = findClosestZeroCrossing(monoSamples, start, zeroCrossingSearch)
  const isTrimmer = slice.type === 'Start' || slice.type === 'End'

  if (isTrimmer) {
    await playTrim(selectedFileIndex)
  } else {
    await playSlice(selectedFileIndex, sliceIndex)
  }

  // newLoadedFiles[selectedFileIndex].slices.sort((a, b) => a.start - b.start)
  LoadedFiles.set(newLoadedFiles)
}
