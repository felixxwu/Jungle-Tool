import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Text } from '../components/Text'
import { Input } from '../components/Input'
import { CurrentUser, Modal } from '../lib/store'
import { getCurrentArrangementState } from '../actions/arrangementState'
import { listSavedArrangements, saveNewArrangement } from '../actions/savedArrangements'
import type { SavedArrangement } from '../lib/types'
import { ArrangementDetailModal } from './ArrangementDetailModal'

export const ArrangementsModal = () => {
  const user = CurrentUser.useState()

  const [arrangements, setArrangements] = useState<SavedArrangement[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const isDuplicateName = arrangements.some(
    a => a.name.trim().toLowerCase() === name.trim().toLowerCase()
  )

  const handleSaveNew = async () => {
    if (!user || !name.trim() || isDuplicateName) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveNewArrangement(user.uid, name.trim(), getCurrentArrangementState())
      setName('')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save arrangement.')
    }
    setSaving(false)
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
        <Input
          value={name}
          onChange={v => {
            setName(v)
            setSaveError(null)
          }}
          placeholder='Arrangement name'
          $fullWidth
        />
        <Text disabled={saving || !name.trim() || isDuplicateName} onClick={handleSaveNew}>
          Save as new
        </Text>
      </Row>
      {isDuplicateName && <div>An arrangement with this name already exists.</div>}
      {!isDuplicateName && saveError && <div>{saveError}</div>}

      <div>My arrangements</div>
      {loading && <div>Loading...</div>}
      {!loading && arrangements.length === 0 && <div>No saved arrangements yet.</div>}
      {arrangements.map(arrangement => (
        <Text
          key={arrangement.id}
          onClick={() => Modal.set(<ArrangementDetailModal arrangement={arrangement} />)}
        >
          {arrangement.name}
        </Text>
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
