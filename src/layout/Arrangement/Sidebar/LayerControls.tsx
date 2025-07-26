import styled from 'styled-components'
import { HDivider, VDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { Layers, Tab } from '../../../lib/store'
import { Slider } from '../../../components/Slider'
import { Fragment } from 'react/jsx-runtime'

export const LayerControls = () => {
  const layers = Layers.useState()

  return (
    <>
      <HDivider style={{ marginTop: 'auto' }} />
      <Text onClick={() => Tab.set('library')}>Add Layer +</Text>
      {layers.map(layer => (
        <Fragment key={layer.filename}>
          <HDivider />
          <Row>
            <Text key={layer.filename} $fullWidth>
              {layer.filename}
            </Text>
            <VDivider />
            <Text onClick={() => Layers.set(layers.filter(l => l.filename !== layer.filename))}>
              x
            </Text>
          </Row>
          <HDivider />
          <Slider
            min={0}
            max={100}
            value={layer.volume * 100}
            onInput={value => {
              layer.volume = value / 100
              Layers.set([...layers])
            }}
          />
        </Fragment>
      ))}
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
