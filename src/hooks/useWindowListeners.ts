import { useEffect } from 'react'
import { Player, Playing, WindowSize } from '../lib/store'
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
        } else {
          Playing.set(true)
          playArrangement()
        }
      }
    })
  }, [])
}
