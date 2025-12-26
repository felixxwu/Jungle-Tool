import { useRef } from 'react'
import {
  Arrangement,
  BPM,
  Layers,
  NoteFadeOut,
  NoteLength,
  Saturation,
  Swing,
  Player,
} from '../lib/store'
import { restartPlayback } from '../actions/restartPlayback'
import { stopPlayback } from '../lib/playback'

export const useRestartPlayback = () => {
  const playbackHash = useRef<string>('')

  const arrangement = Arrangement.useState()
  const layers = Layers.useState()
  const bpm = BPM.useState()
  const swing = Swing.useState()
  const noteLength = NoteLength.useState()
  const noteFadeOut = NoteFadeOut.useState()
  const saturation = Saturation.useState()

  const hash = JSON.stringify({
    arrangement,
    layers,
    bpm,
    swing,
    noteLength,
    noteFadeOut,
    saturation,
  })
  if (hash !== playbackHash.current) {
    playbackHash.current = hash
    if (layers.length) {
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
