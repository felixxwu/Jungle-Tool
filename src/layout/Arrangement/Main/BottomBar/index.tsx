import styled from 'styled-components'
import { HDivider, VDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Arrangement, Player, Playing } from '../../../../lib/store'
import { playArrangement } from '../../../../actions/playArrangement'
import { randomiseArrangement } from '../../../../actions/randomiseArrangement'
import { useEffect, useState } from 'react'

export const BottomBar = () => {
  const playing = Playing.useState()
  const arrangement = Arrangement.useState()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [arrangement])

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
        <VDivider style={{ marginLeft: 'auto' }} />
        <Text
          onClick={async () => {
            setLoading(true)
            await new Promise(r => setTimeout(r))
            randomiseArrangement()
          }}
        >
          {loading ? '...' : 'Randomise'}
        </Text>
      </Row>
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
