import { useEffect, useRef } from 'react'
import { arrangementPlayHead } from '../lib/consts'
import { BPM, NumBars, Player, PlayStartTimestamp, SelectedBar } from '../lib/store'

export const usePlayheadAnimation = () => {
  const prevProgress = useRef<number>(1000)
  const selectedBar = SelectedBar.useState()

  // Hide playhead when selected bar changes
  useEffect(() => {
    const playHead = document.getElementById(arrangementPlayHead)
    if (playHead) {
      playHead.style.display = 'none'
    }
  }, [selectedBar])

  // Animate playhead during playback
  useEffect(() => {
    const intervalId = setInterval(() => {
      const playHead = document.getElementById(arrangementPlayHead)
      const playStartTimestamp = PlayStartTimestamp.ref()
      const player = Player.ref()

      // Hide playhead if not playing
      if (!playStartTimestamp || player?.state === 'stopped') {
        if (playHead) {
          playHead.style.display = 'none'
        }
        return
      }

      // Calculate timing values
      const stepLength = 60 / BPM.ref() / 4
      const barLengthInMs = 16 * stepLength * 1000
      const arrangementLengthInMs = barLengthInMs * NumBars.ref()

      // Calculate progress
      const barProgress = (Date.now() - playStartTimestamp) % barLengthInMs
      const totalProgress =
        (Date.now() - playStartTimestamp + barLengthInMs * SelectedBar.ref()) %
        arrangementLengthInMs

      // Check if we need to start a new animation
      const progressDiff = barProgress - prevProgress.current
      prevProgress.current = barProgress

      if (progressDiff < 0 && playHead && barProgress === totalProgress) {
        playHead.style.display = 'block'
        playHead.animate([{ transform: 'translateX(0%)' }, { transform: 'translateX(100%)' }], {
          duration: barLengthInMs,
          iterations: 1,
        })
      }
    }, 16) // ~60fps

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])
}
