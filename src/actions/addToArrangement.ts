import { Layers, LoadedFiles, Tab } from '../lib/store'

export const addToArrangement = (index: number) => {
  const loadedFiles = LoadedFiles.ref()

  Tab.set('arrangement')
  const layers = Layers.ref()
  layers.push({
    filename: loadedFiles[index].name,
    volume: 100,
    pitch: 0,
  })
  Layers.set([...layers])
}
