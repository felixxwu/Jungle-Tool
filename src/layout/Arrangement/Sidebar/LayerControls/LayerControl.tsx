import styled from 'styled-components'
import { HDivider, VDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers } from '../../../../lib/store'
import { Slider } from '../../../../components/Slider'
import type { Layer } from '../../../../lib/types'
import { largeTextHeight, maxPitch, minPitch } from '../../../../lib/consts'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'

export const LayerControl = (p: { layer: Layer }) => {
  const [localVolume, setLocalVolume] = useDebouncedLocalState(p.layer.volume, value => {
    const layers = Layers.ref()
    const layer = layers.find(l => l.filename === p.layer.filename)
    if (!layer) return

    layer.volume = value
    Layers.set([...layers])
  })

  const [localPitch, setLocalPitch] = useDebouncedLocalState(
    p.layer.pitch,
    value => {
      const layers = Layers.ref()
      const layer = layers.find(l => l.filename === p.layer.filename)
      if (!layer) return

      layer.pitch = value
      Layers.set([...layers])
    },
    300
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
        <Text key={p.layer.filename} $fullWidth style={{ height: largeTextHeight }}>
          {p.layer.filename}
        </Text>
        <VDivider />
        <Text onClick={handleDelete}>x</Text>
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
