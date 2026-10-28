import { useEffect } from 'react'
import { Playing, WindowSize } from '../lib/store'
import { playArrangement } from '../actions/playArrangement'
import { stopArrangement } from '../lib/playback'
import { IS_PLUGIN } from '../lib/plugin'

export const useWindowListeners = () => {
  useEffect(() => {
    const handleResize = () => {
      WindowSize.set({ width: window.innerWidth, height: window.innerHeight })
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !IS_PLUGIN) {
        if (Playing.ref()) {
          stopArrangement()
        } else {
          Playing.set(true)
          playArrangement()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [])
}
