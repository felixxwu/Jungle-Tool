import { useState } from 'react'
import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { AddLayerMode, Layers, Tab } from '../../../../lib/store'
import { LayerControl } from './LayerControl'
import { colors } from '../../../../lib/colors'
import styled from 'styled-components'
import { randomiseLayers } from '../../../../actions/randomiseLayers'

export const LayerControls = () => {
  const layers = Layers.useState()
  const [loading, setLoading] = useState(false)

  const handleAddLayer = () => {
    AddLayerMode.set(true)
    Tab.set('library')
  }

  return (
    <LayerControlsStyle>
      <Text>Layers:</Text>
      {layers.map(layer => (
        <Row key={layer.filename}>
          <LayerControl layer={layer} />
        </Row>
      ))}
      <HDivider />

      <Text
        onClick={async () => {
          setLoading(true)
          await randomiseLayers()
          setLoading(false)
        }}
        big
        style={{
          outline: `1px solid ${colors.black}`,
        }}
      >
        {loading ? '...' : 'Randomise Layers ›'}
      </Text>
      <Text
        onClick={handleAddLayer}
        big
        style={{
          outline: `1px solid ${colors.black}`,
          marginBottom: 'auto',
          marginTop: '1px',
        }}
      >
        Add Layer +
      </Text>
    </LayerControlsStyle>
  )
}

const LayerControlsStyle = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`

const Row = styled('div')`
  display: flex;
  flex-direction: column;
`
