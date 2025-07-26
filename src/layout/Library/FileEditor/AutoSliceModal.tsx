import styled from 'styled-components'
import { Text } from '../../../components/Text'
import { colors } from '../../../lib/colors'
import { AutoSliceMode, Modal } from '../../../lib/store'
import { autoSlice } from '../../../actions/autoSlice'

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
      <Background />
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
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
  text-align: center;
  z-index: 1000;
  gap: 10px;
  background-color: ${colors.white};
  border: 1px solid ${colors.black};
  box-shadow: 10px 10px 0 0 ${colors.black};
`

const Background = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100svh;
  background-color: ${colors.black};
  opacity: 0.5;
  z-index: 999;
`

const Row = styled('div')`
  display: flex;
  gap: 20px;
`
