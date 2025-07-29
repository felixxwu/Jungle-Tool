import styled from 'styled-components'
import { Text } from '../components/Text'
import { Layers, Modal } from '../lib/store'
import { exportCombined } from '../actions/exportCombined'
import { useState } from 'react'
import type { Layer } from '../lib/types'
import { exportLayer } from '../actions/exportLayer'

export const ExportModal = () => {
  const layers = Layers.useState()

  const [combinedExported, setCombinedExported] = useState(false)
  const [exportedLayers, setExportedLayers] = useState<Layer[]>([])

  return (
    <>
      <ModalContent>
        <Text
          disabled={combinedExported}
          onClick={() => {
            exportCombined()
            setCombinedExported(true)
          }}
        >
          Export combined mix
        </Text>
        {layers.map(layer => (
          <Text
            key={layer.filename}
            disabled={exportedLayers.includes(layer)}
            onClick={() => {
              exportLayer(layer)
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
