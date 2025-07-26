import styled from 'styled-components'
import { Text } from '../components/Text'
import { Modal } from '../lib/store'

export const TrimWarningModal = () => {
  const handleOk = () => {
    Modal.set(null)
  }

  return (
    <>
      <ModalContent>
        <div>
          Jungle Tool relies on each break being eactly one bar long. Please trim the uploaded file
          to one bar.
        </div>
        <Row>
          <Text onClick={handleOk}>Ok</Text>
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
