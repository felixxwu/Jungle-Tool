import { useState } from 'react'
import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers, LoadedFiles, Tab } from '../../../../lib/store'
import { LayerControl } from './LayerControl'
import { largeTextHeight } from '../../../../lib/consts'
import { colors } from '../../../../lib/colors'

export const LayerControls = () => {
  const layers = Layers.useState()

  const [loading, setLoading] = useState(false)

  const randomiseLayers = async () => {
    const savedLayers = [...layers]
    Layers.set([])
    await new Promise(r => setTimeout(r, 300))
    const loadedFiles = LoadedFiles.ref()
    for (let i = 0; i < savedLayers.length; i++) {
      const takenLayers = savedLayers.slice(0, i).map(l => l.filename)
      const remainingFiles = loadedFiles.filter(f => !takenLayers.includes(f.name))
      const randomFile = remainingFiles[Math.floor(Math.random() * remainingFiles.length)]
      savedLayers[i].filename = randomFile.name
    }
    Layers.set([...savedLayers])
  }

  return (
    <>
      <Text style={{ width: 'fit-content', outline: `1px solid ${colors.black}` }}>Layers:</Text>
      {layers.map(layer => (
        <LayerControl key={layer.filename} layer={layer} />
      ))}

      <HDivider />
      <Text
        onClick={async () => {
          setLoading(true)
          randomiseLayers()
          await new Promise(r => setTimeout(r, 300))
          setLoading(false)
        }}
        style={{
          height: largeTextHeight,
          width: 'fit-content',
          outline: `1px solid ${colors.black}`,
        }}
      >
        {loading ? '...' : 'Randomise Layers ›'}
      </Text>
      <Text
        onClick={() => Tab.set('library')}
        style={{
          height: largeTextHeight,
          outline: `1px solid ${colors.black}`,
          width: 'fit-content',
          marginBottom: 'auto',
          marginTop: '1px',
        }}
      >
        Add Layer +
      </Text>
    </>
  )
}
