import { useState } from 'react'
import styled from 'styled-components'
import { Text } from '../components/Text'
import { Modal } from '../lib/store'
import { getCurrentArrangementState, applyArrangementState } from '../actions/arrangementState'
import { deleteArrangement, overwriteArrangement } from '../actions/savedArrangements'
import type { SavedArrangement } from '../lib/types'
import { ArrangementsModal } from './ArrangementsModal'

export const ArrangementDetailModal = (p: { arrangement: SavedArrangement }) => {
  const [busy, setBusy] = useState(false)

  const handleLoad = () => {
    applyArrangementState(p.arrangement.state)
    Modal.set(null)
  }

  const handleOverwrite = async () => {
    setBusy(true)
    await overwriteArrangement(p.arrangement.id, getCurrentArrangementState())
    setBusy(false)
    Modal.set(<ArrangementsModal />)
  }

  const handleDelete = async () => {
    setBusy(true)
    await deleteArrangement(p.arrangement.id)
    setBusy(false)
    Modal.set(<ArrangementsModal />)
  }

  return (
    <ModalContent>
      <div>{p.arrangement.name}</div>
      <Text disabled={busy} onClick={handleLoad}>
        Load
      </Text>
      <Text disabled={busy} onClick={handleOverwrite}>
        Overwrite with current arrangement
      </Text>
      <Text disabled={busy} onClick={handleDelete}>
        Delete
      </Text>
      <Text onClick={() => Modal.set(<ArrangementsModal />)}>Back</Text>
    </ModalContent>
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
