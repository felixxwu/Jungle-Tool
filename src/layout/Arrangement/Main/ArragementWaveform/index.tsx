import { useRef } from 'react'
import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { mono } from '../../../../lib/audio'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'
import { restartPlayback } from '../../../../actions/restartPlayback'
import {
  Arrangement,
  BPM,
  Layers,
  NoteFadeOut,
  NoteLength,
  Saturation,
  SelectedBar,
  Swing,
} from '../../../../lib/store'

const waveformWidth = appWidth - arrangementSidebarWidth - 1

export const ArragementWaveform = () => {
  const playbackHash = useRef<string>('')

  const selectedBar = SelectedBar.useState()
  const arrangement = Arrangement.useState()
  const layers = Layers.useState()
  const bpm = BPM.useState()
  const swing = Swing.useState()
  const noteLength = NoteLength.useState()
  const noteFadeOut = NoteFadeOut.useState()
  const saturation = Saturation.useState()
  const samples = useArrangementSamples({ bar: selectedBar })

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
    restartPlayback()
  }

  if (!samples) return null

  const monoSamples = mono(samples)

  return (
    <Waveform
      samples={monoSamples}
      width={waveformWidth}
      height={125}
      offset={0}
      scaleX={1}
      slices={[]}
    />
  )
}
