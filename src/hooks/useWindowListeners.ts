import { useEffect } from 'react'
import { Playing, WindowSize } from '../lib/store'
import { playArrangement } from '../actions/playArrangement'
import { stopPlayback } from '../lib/playback'

export const useWindowListeners = () => {
  useEffect(() => {
    window.addEventListener('resize', () => {
      WindowSize.set({ width: window.innerWidth, height: window.innerHeight })
    })

    window.addEventListener('keydown', e => {
      if (e.key === ' ') {
        if (Playing.ref()) {
          stopPlayback()
        } else {
          Playing.set(true)
          playArrangement()
        }
      }
    })
  }, [])
}
