import styled from 'styled-components'
import { Text } from '../components/Text'
import { AutoSliceMode, Modal } from '../lib/store'
import { autoSlice } from '../actions/autoSlice'

export const AutoSliceModal = () => {
  const handleNo = () => {
    Modal.set(null)
  }

  const handleYes = () => {
    Modal.set(null)
    AutoSliceMode.set(true)
    autoSlice()
  }

  return (
    <>
      <ModalContent>
        <div>Auto-slicing will replace all existing slices. Do you want to continue?</div>
        <Row>
          <Text onClick={handleNo}>No</Text>
          <Text onClick={handleYes}>Yes</Text>
        </Row>
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
`

const Row = styled('div')`
  display: flex;
  gap: 20px;
`
