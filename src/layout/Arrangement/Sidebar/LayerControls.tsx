import styled from 'styled-components'
import { HDivider, VDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { Layers, Player, Tab } from '../../../lib/store'
import { Slider } from '../../../components/Slider'
import { Fragment } from 'react/jsx-runtime'
import { playArrangement } from '../../../actions/playArrangement'
import type { Layer } from '../../../lib/types'

export const LayerControls = () => {
  const layers = Layers.useState()

  const handleVolumeChange = (layer: Layer, volume: number) => {
    layer.volume = volume / 100
    Layers.set([...layers])

    if (Player.ref()?.state === 'started') {
      playArrangement()
    }
  }

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
            onInput={value => handleVolumeChange(layer, value)}
          />
        </Fragment>
      ))}
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
