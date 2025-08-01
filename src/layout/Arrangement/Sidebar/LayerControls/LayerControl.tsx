import styled from 'styled-components'
import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers } from '../../../../lib/store'
import { Slider } from '../../../../components/Slider'
import type { Layer } from '../../../../lib/types'
import { largeTextHeight, maxPitch, minPitch } from '../../../../lib/consts'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'

export const LayerControl = (p: { layer: Layer }) => {
  const [localVolume, setLocalVolume] = useDebouncedLocalState(
    p.layer.volume,
    value => {
      const layers = Layers.ref()
      const layerIndex = layers.findIndex(l => l.filename === p.layer.filename)
      if (layerIndex === -1) return

      p.layer.volume = value
      layers[layerIndex] = p.layer

      Layers.set([...layers])
    },
    500
  )

  const [localPitch, setLocalPitch] = useDebouncedLocalState(
    p.layer.pitch,
    value => {
      const layers = Layers.ref()
      const layerIndex = layers.findIndex(l => l.filename === p.layer.filename)
      if (layerIndex === -1) return

      p.layer.pitch = value
      layers[layerIndex] = p.layer
      Layers.set([...layers])
    },
    500
  )

  const handleDelete = () => {
    const layers = Layers.ref()
    Layers.set(layers.filter(l => l.filename !== p.layer.filename))
  }

  const pitch = localPitch

  return (
    <>
      <HDivider />
      <Row>
        <Text selected key={p.layer.filename} $fullWidth style={{ height: largeTextHeight }}>
          {p.layer.filename}
        </Text>
        <Text
          selected
          onClick={handleDelete}
          style={{ textTransform: 'lowercase', paddingTop: '4px' }}
        >
          x
        </Text>
      </Row>
      <HDivider />
      <Slider
        min={minPitch}
        max={maxPitch}
        value={pitch}
        onInput={setLocalPitch}
        label={`Pitch: ${pitch > 0 ? `+${pitch}` : pitch}`}
      />
      <HDivider />
      <Slider
        min={0}
        max={100}
        value={localVolume}
        onInput={setLocalVolume}
        label={`Vol: ${localVolume}`}
      />
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
