import styled from 'styled-components'
import { VDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Arrangement, LibraryLoading, Modal, Player, Playing } from '../../../../lib/store'
import { playArrangement } from '../../../../actions/playArrangement'
import { randomiseArrangement } from '../../../../actions/randomiseArrangement'
import { useEffect, useState } from 'react'
import { largeTextHeight } from '../../../../lib/consts'
import { ExportModal } from '../../../../modals/ExportModal'

export const BottomBar = () => {
  const playing = Playing.useState()
  const arrangement = Arrangement.useState()
  const libraryLoading = LibraryLoading.useState()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [arrangement])

  const handleStop = () => {
    Player.ref()?.stop()
    Playing.set(false)
  }

  const handlePlayPause = () => {
    if (playing) {
      handleStop()
    } else {
      playArrangement()
    }
  }

  return (
    <>
      <Row>
        <Text
          onClick={handlePlayPause}
          selected={playing}
          style={{ height: largeTextHeight }}
          disabled={libraryLoading}
        >
          {playing ? 'Pause' : 'Play'}
        </Text>
        <VDivider />
        <Text
          onClick={async () => {
            setLoading(true)
            await new Promise(r => setTimeout(r))
            randomiseArrangement()
          }}
        >
          {loading ? '...' : 'Randomise notes'}
        </Text>
        <VDivider />
        <VDivider style={{ marginLeft: 'auto' }} />
        <Text onClick={() => Modal.set(<ExportModal />)}>Export</Text>
      </Row>
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
