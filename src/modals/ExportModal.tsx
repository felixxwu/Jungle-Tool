import styled from 'styled-components'
import { Text } from '../components/Text'
import { CurrentUser, Modal } from '../lib/store'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { ArrangementsModal } from './ArrangementsModal'
import { WavExportModal } from './WavExportModal'

export const ExportModal = () => {
  const user = CurrentUser.useState()

  return (
    <>
      <ModalContent>
        <Text onClick={() => Modal.set(<WavExportModal />)}>Export layers to WAV</Text>
        <Text disabled={!user} onClick={() => Modal.set(<ArrangementsModal />)}>
          Save / load arrangement
        </Text>
        {user ? (
          <Text onClick={() => signOut(auth)}>Log out ({user.displayName})</Text>
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
