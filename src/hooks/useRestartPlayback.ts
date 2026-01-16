import { useRef } from 'react'
import { Player } from '../lib/store'
import { restartPlayback } from '../actions/restartPlayback'
import { stopPlayback } from '../lib/playback'
import { isDeepEqual } from '../helpers/deepEqual'
import { useArrangementStateValues } from './useArrangementStates'

export const useRestartPlayback = () => {
  const lastConfig = useRef<ReturnType<typeof useArrangementStateValues> | null>(null)

  const currentConfig = useArrangementStateValues()

  if (!isDeepEqual(currentConfig, lastConfig.current)) {
    lastConfig.current = currentConfig
    if (currentConfig.layers.length) {
      restartPlayback()
    } else {
      // Stop playback if no layers remain and audio is playing
      const player = Player.ref()
      if (player?.state === 'started') {
        stopPlayback()
      }
    }
  }
}
