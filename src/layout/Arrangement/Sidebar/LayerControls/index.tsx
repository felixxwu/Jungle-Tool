import { useState } from 'react'
import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { AddLayerMode, Layers, Tab, Playing, Player } from '../../../../lib/store'
import { LayerControl } from './LayerControl'
import { colors } from '../../../../lib/colors'
import styled from 'styled-components'
import { randomiseLayers } from '../../../../actions/randomiseLayers'
import { playArrangement } from '../../../../actions/playArrangement'

export const LayerControls = () => {
  const layers = Layers.useState()
  const [loading, setLoading] = useState(false)

  const handleAddLayer = () => {
    AddLayerMode.set(true)
    Tab.set('library')
  }

  return (
    <LayerControlsStyle>
      <Text>Layers:</Text>
      {layers.map(layer => (
        <Row key={layer.filename}>
          <LayerControl layer={layer} />
        </Row>
      ))}
      <HDivider />

      <Text
        onClick={async () => {
          // Check if playback is currently active before randomising
          const wasPlaying = Playing.ref() && Player.ref()?.state === 'started'

          setLoading(true)
          await randomiseLayers()
          setLoading(false)

          // If playback was active, ensure it continues after randomisation
          // The useRestartPlayback hook should handle this via restartPlayback(),
          // but we add a safeguard to ensure playback continues if the hook
          // doesn't trigger properly (e.g., due to debounce timing)
          if (wasPlaying) {
            // Wait for the debounced restartPlayback to execute (200ms + buffer)
            await new Promise(r => setTimeout(r, 250))
            // Verify playback is still active, restart if needed
            const player = Player.ref()
            if (!player || player.state !== 'started') {
              playArrangement()
            }
          }
        }}
        big
        style={{
          outline: `1px solid ${colors.black}`,
        }}
      >
        {loading ? '...' : 'Randomise Layers ›'}
      </Text>
      <Text
        onClick={handleAddLayer}
        big
        style={{
          outline: `1px solid ${colors.black}`,
          marginBottom: 'auto',
          marginTop: '1px',
        }}
      >
        Add Layer +
      </Text>
    </LayerControlsStyle>
  )
}

const LayerControlsStyle = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`

const Row = styled('div')`
  display: flex;
  flex-direction: column;
`
