import styled from 'styled-components'
import { Text } from '../components/Text'
import { Layers, Modal } from '../lib/store'
import { exportCombined } from '../actions/exportCombined'
import { useState } from 'react'
import type { Layer } from '../lib/types'
import { exportLayer } from '../actions/exportLayer'

export const WavExportModal = () => {
  const layers = Layers.useState()

  const [combinedExported, setCombinedExported] = useState(false)
  const [exportedLayers, setExportedLayers] = useState<Layer[]>([])
  const [exportingCombined, setExportingCombined] = useState(false)
  const [exportingLayers, setExportingLayers] = useState<Layer[]>([])
  const [keepSaturation, setKeepSaturation] = useState(true)
  const [keepSwing, setKeepSwing] = useState(true)

  const overrides = {
    saturation: keepSaturation ? undefined : 0,
    swing: keepSwing ? undefined : 0,
  }

  return (
    <>
      <ModalContent>
        <div>Include in export:</div>
        <Row>
          <Text selected={keepSaturation} onClick={() => setKeepSaturation(v => !v)}>
            Saturation: {keepSaturation ? 'yes' : ' no'}
          </Text>
          <Text selected={keepSwing} onClick={() => setKeepSwing(v => !v)}>
            Swing: {keepSwing ? 'yes' : ' no'}
          </Text>
        </Row>
        <Text
          disabled={combinedExported || exportingCombined}
          onClick={async () => {
            setExportingCombined(true)
            await exportCombined(overrides)
            setExportingCombined(false)
            setCombinedExported(true)
          }}
        >
          Export combined mix
        </Text>
        {layers.map(layer => (
          <Text
            key={layer.filename}
            disabled={exportedLayers.includes(layer) || exportingLayers.includes(layer)}
            onClick={async () => {
              setExportingLayers([...exportingLayers, layer])
              await exportLayer(layer, overrides)
              setExportingLayers(exportingLayers.filter(l => l !== layer))
              setExportedLayers([...exportedLayers, layer])
            }}
          >
            Export {layer.filename} layer
          </Text>
        ))}
        <Text onClick={() => Modal.set(null)}>Close</Text>
      </ModalContent>
    </>
  )
}

const ModalContent = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 100vw;

  & > * {
    white-space: normal;
  }
`

const Row = styled('div')`
  display: flex;
  gap: 10px;
`
