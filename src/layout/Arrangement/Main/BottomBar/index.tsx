import styled from 'styled-components'
import { HDivider, VDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Player, Playing } from '../../../../lib/store'
import { playArrangement } from '../../../../actions/playArrangement'

export const BottomBar = () => {
  const playing = Playing.useState()

  const handleStop = () => {
    Player.ref()?.stop()
    Playing.set(false)
  }

  return (
    <>
      <HDivider style={{ marginTop: 'auto' }} />
      <Row>
        <Text onClick={playArrangement} selected={playing}>
          Play
        </Text>
        <VDivider />
        <Text onClick={handleStop}>Stop</Text>
        <VDivider />
      </Row>
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
