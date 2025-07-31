import { Layers, LoadedFiles, SelectedFileIndex, Tab } from '../lib/store'

export const addToArrangement = () => {
  const loadedFiles = LoadedFiles.ref()
  const selectedFileIndex = SelectedFileIndex.ref()
  if (selectedFileIndex === null) return

  Tab.set('arrangement')
  const layers = Layers.ref()
  layers.push({
    filename: loadedFiles[selectedFileIndex].name,
    volume: 100,
    pitch: 0,
  })
  Layers.set([...layers])
}
