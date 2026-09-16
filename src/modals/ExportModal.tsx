import styled from 'styled-components'
import { Text } from '../components/Text'
import { CurrentUser, Layers, Modal } from '../lib/store'
import { exportCombined } from '../actions/exportCombined'
import { useState } from 'react'
import type { Layer } from '../lib/types'
import { exportLayer } from '../actions/exportLayer'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { ArrangementsModal } from './ArrangementsModal'

export const ExportModal = () => {
  const layers = Layers.useState()
  const user = CurrentUser.useState()

  const [combinedExported, setCombinedExported] = useState(false)
  const [exportedLayers, setExportedLayers] = useState<Layer[]>([])
  const [exportingCombined, setExportingCombined] = useState(false)
  const [exportingLayers, setExportingLayers] = useState<Layer[]>([])

  return (
    <>
      <ModalContent>
        <Text
          disabled={combinedExported || exportingCombined}
          onClick={async () => {
            setExportingCombined(true)
            await exportCombined()
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
              await exportLayer(layer)
              setExportingLayers(exportingLayers.filter(l => l !== layer))
              setExportedLayers([...exportedLayers, layer])
            }}
          >
            Export {layer.filename} layer
          </Text>
        ))}
        {user ? (
          <>
            <Text onClick={() => Modal.set(<ArrangementsModal />)}>Save / load arrangement</Text>
            <Text onClick={() => signOut(auth)}>Log out ({user.displayName})</Text>
          </>
        ) : (
          <Text onClick={() => signInWithPopup(auth, googleProvider)}>Log in with Google</Text>
        )}
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
