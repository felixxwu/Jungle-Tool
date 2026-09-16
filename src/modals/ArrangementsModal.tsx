import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Text } from '../components/Text'
import { Input } from '../components/Input'
import { CurrentUser, Modal } from '../lib/store'
import { getCurrentArrangementState, applyArrangementState } from '../actions/arrangementState'
import {
  deleteArrangement,
  listSavedArrangements,
  saveNewArrangement,
  overwriteArrangement,
} from '../actions/savedArrangements'
import type { SavedArrangement } from '../lib/types'

export const ArrangementsModal = () => {
  const user = CurrentUser.useState()

  const [arrangements, setArrangements] = useState<SavedArrangement[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = async () => {
    if (!user) return
    setLoading(true)
    setArrangements(await listSavedArrangements(user.uid))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSaveNew = async () => {
    if (!user || !name.trim()) return
    setSaving(true)
    await saveNewArrangement(user.uid, name.trim(), getCurrentArrangementState())
    setName('')
    setSaving(false)
    await refresh()
  }

  const handleOverwrite = async (arrangement: SavedArrangement) => {
    setBusyId(arrangement.id)
    await overwriteArrangement(arrangement.id, getCurrentArrangementState())
    setBusyId(null)
    await refresh()
  }

  const handleLoad = (arrangement: SavedArrangement) => {
    applyArrangementState(arrangement.state)
    Modal.set(null)
  }

  const handleDelete = async (arrangement: SavedArrangement) => {
    setBusyId(arrangement.id)
    await deleteArrangement(arrangement.id)
    setBusyId(null)
    await refresh()
  }

  if (!user) {
    return (
      <ModalContent>
        <div>Log in with Google to save arrangements to your account.</div>
        <Text onClick={() => Modal.set(null)}>Close</Text>
      </ModalContent>
    )
  }

  return (
    <ModalContent>
      <div>Save current arrangement</div>
      <Row>
        <Input value={name} onChange={setName} $fullWidth />
        <Text disabled={saving || !name.trim()} onClick={handleSaveNew}>
          Save as new
        </Text>
      </Row>

      <div>My arrangements</div>
      {loading && <div>Loading...</div>}
      {!loading && arrangements.length === 0 && <div>No saved arrangements yet.</div>}
      {arrangements.map(arrangement => (
        <ArrangementRow key={arrangement.id}>
          <Text disabled={busyId === arrangement.id} onClick={() => handleLoad(arrangement)}>
            Load {arrangement.name}
          </Text>
          <Text disabled={busyId === arrangement.id} onClick={() => handleOverwrite(arrangement)}>
            Overwrite
          </Text>
          <Text disabled={busyId === arrangement.id} onClick={() => handleDelete(arrangement)}>
            Delete
          </Text>
        </ArrangementRow>
      ))}

      <Text onClick={() => Modal.set(null)}>Close</Text>
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

const Row = styled('div')`
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: center;
`

const ArrangementRow = styled('div')`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`
