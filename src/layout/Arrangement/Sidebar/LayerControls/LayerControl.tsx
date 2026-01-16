import styled from 'styled-components'
import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers, SelectedLayerName } from '../../../../lib/store'
import { Slider } from '../../../../components/Slider'
import type { Layer } from '../../../../lib/types'
import { maxPitch, minPitch } from '../../../../lib/consts'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'
import { colors } from '../../../../lib/colors'

export const LayerControl = (p: { layer: Layer }) => {
  const selectedLayerName = SelectedLayerName.useState()
  const [localVolume, setLocalVolume] = useDebouncedLocalState(
    p.layer.volume,
    value => {
      const layers = Layers.ref()
      const layerIndex = layers.findIndex(l => l.filename === p.layer.filename)
      if (layerIndex === -1) return

      const newLayers = [...layers]
      newLayers[layerIndex] = { ...newLayers[layerIndex], volume: value }

      Layers.set(newLayers)
    },
    500
  )

  const [localPitch, setLocalPitch] = useDebouncedLocalState(
    p.layer.pitch,
    value => {
      const layers = Layers.ref()
      const layerIndex = layers.findIndex(l => l.filename === p.layer.filename)
      if (layerIndex === -1) return

      const newLayers = [...layers]
      newLayers[layerIndex] = { ...newLayers[layerIndex], pitch: value }

      Layers.set(newLayers)
    },
    500
  )

  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const layers = Layers.ref()
    Layers.set(layers.filter(l => l.filename !== p.layer.filename))
  }

  const handleToggleSelectedLayer = () => {
    if (selectedLayerName === p.layer.filename) {
      SelectedLayerName.set(null)
    } else {
      SelectedLayerName.set(p.layer.filename)
    }
  }

  const pitch = localPitch

  const handlePointerLeave = () => {
    if (selectedLayerName === p.layer.filename) {
      SelectedLayerName.set(null)
    }
  }

  return (
    <LayerControlContainer onPointerLeave={handlePointerLeave}>
      <HDivider />
      <Row>
        <TitleAndInfo onClick={handleToggleSelectedLayer}>
          <Row>
            <Text onClick={handleToggleSelectedLayer} key={p.layer.filename} fullWidth big>
              {p.layer.filename}
            </Text>
            {selectedLayerName === p.layer.filename ? (
              <Text onClick={handleToggleSelectedLayer}>‹</Text>
            ) : (
              <Text
                onClick={handleDelete}
                style={{ textTransform: 'lowercase', paddingTop: '4px' }}
              >
                x
              </Text>
            )}
          </Row>
          {selectedLayerName !== p.layer.filename && (
            <Row>
              <Text big onClick={handleToggleSelectedLayer}>
                Vol: {p.layer.volume}
              </Text>
              <Text big onClick={handleToggleSelectedLayer}>
                Pitch: {pitch > 0 ? `+${pitch}` : pitch}
              </Text>
            </Row>
          )}
        </TitleAndInfo>
      </Row>
      {selectedLayerName === p.layer.filename && (
        <>
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
      )}
    </LayerControlContainer>
  )
}

const LayerControlContainer = styled('div')`
  width: 100%;
`

const Row = styled('div')`
  display: flex;
`

const TitleAndInfo = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${colors.white};
`
