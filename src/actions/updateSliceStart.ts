import { LoadedFiles, SelectedFileIndex } from '../lib/store'
import { playSlice } from './playSlice'
import { playTrim } from './playTrim'

export const updateSliceStart = async (start: number, sliceIndex: number) => {
  const selectedFileIndex = SelectedFileIndex.ref()
  if (selectedFileIndex === null) return

  const newLoadedFiles = [...LoadedFiles.ref()]
  const slice = newLoadedFiles[selectedFileIndex].slices[sliceIndex]
  slice.start = start
  const isTrimmer = slice.type === 'Start' || slice.type === 'End'

  if (isTrimmer) {
    await playTrim(selectedFileIndex)
  } else {
    await playSlice(selectedFileIndex, sliceIndex)
  }

  // newLoadedFiles[selectedFileIndex].slices.sort((a, b) => a.start - b.start)
  LoadedFiles.set(newLoadedFiles)
}
