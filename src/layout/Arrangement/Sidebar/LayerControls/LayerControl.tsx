import styled from 'styled-components'
import { HDivider, VDivider } from '../../../../components/Dividers'
import { Layers } from '../../../../lib/store'
import { Slider, sliderHeight } from '../../../../components/Slider'
import type { Layer } from '../../../../lib/types'
import { maxPitch, minPitch } from '../../../../lib/consts'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'
import { colors } from '../../../../lib/colors'

export const LayerControl = (p: { layer: Layer }) => {
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
    <LayerControlContainer>
      <HDivider />
      <Row>
        <NameSide>
          <NameText>{p.layer.filename}</NameText>
        </NameSide>
        <VDivider />
        <SlidersSide>
          <SliderRow>
            <SliderWrapper>
              <Slider
                min={0}
                max={100}
                value={localVolume}
                onInput={setLocalVolume}
                label={`Vol: ${localVolume}`}
              />
            </SliderWrapper>
            <VDivider />
            <IconBox onClick={handleDelete}>x</IconBox>
          </SliderRow>
          <HDivider />
          <SliderRow>
            <SliderWrapper>
              <Slider
                min={minPitch}
                max={maxPitch}
                value={pitch}
                onInput={setLocalPitch}
                label={`Pitch: ${pitch > 0 ? `+${pitch}` : pitch}`}
              />
            </SliderWrapper>
            <VDivider />
            <IconBox />
          </SliderRow>
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

const SlidersSide = styled('div')`
  width: 60%;
  display: flex;
  flex-direction: column;
`

const SliderRow = styled('div')`
  display: flex;
  align-items: stretch;
  width: 100%;
`

const SliderWrapper = styled('div')`
  flex: 1;
  min-width: 0;
`

const IconBox = styled('div')<{ onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }>`
  width: ${sliderHeight}px;
  min-width: ${sliderHeight}px;
  height: ${sliderHeight}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.white};
  color: ${colors.black};
  text-transform: lowercase;
  cursor: ${p => (p.onClick ? 'pointer' : 'default')};

  &:hover {
    @media (hover: hover) {
      background-color: ${p => (p.onClick ? colors.grey : 'transparent')};
    }
  }
`
