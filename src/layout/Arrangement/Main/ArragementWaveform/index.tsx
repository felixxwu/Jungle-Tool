import { useEffect } from 'react'
import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { mono } from '../../../../lib/audio'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'
import { restartPlayback } from '../../../../actions/restartPlayback'
import { Arrangement, BPM, Layers, SelectedBar, Swing } from '../../../../lib/store'

const waveformWidth = appWidth - arrangementSidebarWidth - 1

export const ArragementWaveform = () => {
  const selectedBar = SelectedBar.useState()
  const arrangement = Arrangement.useState()
  const layers = Layers.useState()
  const bpm = BPM.useState()
  const swing = Swing.useState()
  const samples = useArrangementSamples({ bar: selectedBar })

  useEffect(() => {
    restartPlayback()
  }, [arrangement, layers, bpm, swing])

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
