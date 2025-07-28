import { useState } from 'react'
import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers, LoadedFiles, Tab } from '../../../../lib/store'
import { LayerControl } from './LayerControl'

export const LayerControls = () => {
  const layers = Layers.useState()

  const [loading, setLoading] = useState(false)

  const randomiseLayers = () => {
    const loadedFiles = LoadedFiles.ref()
    for (let i = 0; i < layers.length; i++) {
      const takenLayers = layers.slice(0, i).map(l => l.filename)
      const remainingFiles = loadedFiles.filter(f => !takenLayers.includes(f.name))
      const randomFile = remainingFiles[Math.floor(Math.random() * remainingFiles.length)]
      layers[i].filename = randomFile.name
    }
    Layers.set([...layers])
  }

  return (
    <>
      {layers.map(layer => (
        <LayerControl key={layer.filename} layer={layer} />
      ))}
      <HDivider />
      <Text onClick={() => Tab.set('library')}>Add Layer +</Text>
      <HDivider />
      <Text
        onClick={async () => {
          setLoading(true)
          await new Promise(r => setTimeout(r, 300))
          randomiseLayers()
          setLoading(false)
        }}
      >
        {loading ? '...' : 'Randomise Layers ›'}
      </Text>
    </>
  )
}
