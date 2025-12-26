import { useEffect } from 'react'
import { Player, Playing, WindowSize, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { playArrangement } from '../actions/playArrangement'

export const useWindowListeners = () => {
  useEffect(() => {
    window.addEventListener('resize', () => {
      WindowSize.set({ width: window.innerWidth, height: window.innerHeight })
    })

    window.addEventListener('keydown', e => {
      if (e.key === ' ') {
        if (Playing.ref()) {
          Playing.set(false)
          Player.ref()?.stop()
          // Clear play states when manually stopping
          PlayStartTimestamp.set(null)
          PlayDuration.set(null)
        } else {
          Playing.set(true)
          playArrangement()
        }
      }
    })
  }, [])
}
