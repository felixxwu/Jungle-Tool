import { useState } from 'react'
import styled from 'styled-components'
import { HDivider, VDivider } from '../../../../components/Dividers'
import { Layers } from '../../../../lib/store'
import { Slider } from '../../../../components/Slider'
import type { Layer } from '../../../../lib/types'
import { maxPitch, minPitch } from '../../../../lib/consts'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'
import { colors } from '../../../../lib/colors'

export const LayerControl = (p: { layer: Layer }) => {
  const [hovered, setHovered] = useState(false)
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

  const pitch = localPitch

  return (
    <LayerControlContainer
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <HDivider />
      <Row>
        <NameSide>
          <NameText>{p.layer.filename}</NameText>
          {hovered && <DeleteButton onClick={handleDelete}>x</DeleteButton>}
        </NameSide>
        <VDivider />
        <SlidersSide>
          <Slider
            min={0}
            max={100}
            value={localVolume}
            onInput={setLocalVolume}
            label={`Vol: ${localVolume}`}
          />
          <HDivider />
          <Slider
            min={minPitch}
            max={maxPitch}
            value={pitch}
            onInput={setLocalPitch}
            label={`Pitch: ${pitch > 0 ? `+${pitch}` : pitch}`}
          />
        </SlidersSide>
      </Row>
    </LayerControlContainer>
  )
}

const LayerControlContainer = styled('div')`
  width: 100%;
`

const Row = styled('div')`
  display: flex;
  width: 100%;
`

const NameSide = styled('div')`
  position: relative;
  width: 40%;
  display: flex;
  align-items: center;
  padding: 6px 15px 5px 15px;
  box-sizing: border-box;
  background-color: ${colors.white};
  overflow: hidden;
`

const NameText = styled('div')`
  width: 100%;
  word-break: break-all;
  overflow-wrap: break-word;
  color: ${colors.black};
`

const DeleteButton = styled('div')`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.grey};
  color: ${colors.black};
  cursor: pointer;
  text-transform: lowercase;
`

const SlidersSide = styled('div')`
  width: 60%;
  display: flex;
  flex-direction: column;
`
