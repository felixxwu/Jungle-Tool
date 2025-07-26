import { LoadedFiles, SelectedFileIndex, SelectedSliceIndex } from '../lib/store'
import type { SliceType } from '../lib/types'

export const addSlice = () => {
  const selectedFileIndex = SelectedFileIndex.ref()
  const loadedFiles = LoadedFiles.ref()
  const selectedSliceIndex = SelectedSliceIndex.ref()

  if (selectedFileIndex === null) return

  const selectedFile = loadedFiles[selectedFileIndex]
  const selectedSlice = selectedSliceIndex === null ? null : selectedFile.slices[selectedSliceIndex]

  const lastSlice = selectedFile.slices.filter(slice => slice.type !== 'End')[
    selectedFile.slices.length - 1
  ]
  const start = (() => {
    if (selectedSlice) {
      return selectedSlice.start + 5000
    }
    if (lastSlice) {
      return lastSlice.start + 5000
    }
    return 0
  })()
  const newLoadedFiles = [...loadedFiles]
  newLoadedFiles[selectedFileIndex].slices.push({ start, type: 'Hat' as SliceType })
  newLoadedFiles[selectedFileIndex].slices.sort((a, b) => a.start - b.start)
  LoadedFiles.set(newLoadedFiles)
}
