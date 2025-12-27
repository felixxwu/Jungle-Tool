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
import { isDeepEqual } from '../helpers/deepEqual'
import type { Note, Layer } from '../lib/types'

type PlaybackConfig = {
  arrangement: Note[]
  layers: Layer[]
  bpm: number
  swing: number
  noteLength: number
  noteFadeOut: number
  saturation: number
}

export const useRestartPlayback = () => {
  const lastConfig = useRef<PlaybackConfig | null>(null)

  const arrangement = Arrangement.useState()
  const layers = Layers.useState()
  const bpm = BPM.useState()
  const swing = Swing.useState()
  const noteLength = NoteLength.useState()
  const noteFadeOut = NoteFadeOut.useState()
  const saturation = Saturation.useState()

  const currentConfig: PlaybackConfig = {
    arrangement,
    layers,
    bpm,
    swing,
    noteLength,
    noteFadeOut,
    saturation,
  }

  if (!isDeepEqual(currentConfig, lastConfig.current)) {
    lastConfig.current = currentConfig
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
