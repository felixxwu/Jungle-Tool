import styled from 'styled-components'
import { VDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import {
  Arrangement,
  HostPlaying,
  LibraryLoading,
  Modal,
  Playing,
  PluginMode,
  Tab,
} from '../../../../lib/store'
import { playArrangement } from '../../../../actions/playArrangement'
import { randomiseArrangement } from '../../../../actions/randomiseArrangement'
import { useEffect, useState } from 'react'
import { ExportModal } from '../../../../modals/ExportModal'
import { stopArrangement } from '../../../../lib/playback'
import { IS_PLUGIN } from '../../../../lib/plugin'

export const BottomBar = () => {
  const playing = Playing.useState()
  const arrangement = Arrangement.useState()
  const libraryLoading = LibraryLoading.useState()
  const tab = Tab.useState()
  const hostPlaying = HostPlaying.useState()
  const pluginMode = PluginMode.useState()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [arrangement])

  const handleStop = () => {
    stopArrangement()
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
          big
          disabled={libraryLoading || hostPlaying}
        >
          {playing ? 'Pause' : 'Play'}
        </Text>
        {tab !== 'layers' && (
          <>
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
          </>
        )}
        <VDivider />
        <VDivider style={{ marginLeft: 'auto' }} />
        {IS_PLUGIN ? (
          <Text
            onClick={() => PluginMode.set(pluginMode === 'midi' ? 'sequencer' : 'midi')}
            title={
              pluginMode === 'midi'
                ? 'MIDI notes 36 to 51 play steps 0 to 15 of every layer'
                : 'Hold any MIDI note to play the arrangement from its start'
            }
          >
            {pluginMode === 'midi' ? 'Mode: MIDI notes' : 'Mode: Sequencer'}
          </Text>
        ) : (
          <Text onClick={() => Modal.set(<ExportModal />)}>Save / Export</Text>
        )}
      </Row>
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
