import { useState } from 'react'
import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers, Tab } from '../../../../lib/store'
import { LayerControl } from './LayerControl'
import { largeTextHeight } from '../../../../lib/consts'
import { colors } from '../../../../lib/colors'
import styled from 'styled-components'
import { randomiseLayers } from '../../../../actions/randomiseLayers'

export const LayerControls = () => {
  const layers = Layers.useState()
  const [loading, setLoading] = useState(false)

  return (
    <LayerControlsStyle>
      <Text style={{ width: 'fit-content', outline: `1px solid ${colors.black}` }}>Layers:</Text>
      {layers.map(layer => (
        <Row key={layer.filename}>
          <LayerControl layer={layer} />
          <HDivider />
        </Row>
      ))}

      <Text
        onClick={async () => {
          setLoading(true)
          await randomiseLayers()
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
