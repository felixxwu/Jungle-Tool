import { useEffect } from 'react'
import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { mono } from '../../../../lib/audio'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'
import { restartPlayback } from '../../../../actions/restartPlayback'

const waveformWidth = appWidth - arrangementSidebarWidth - 1

export const ArragementWaveform = () => {
  const samples = useArrangementSamples()
  useEffect(() => {
    restartPlayback()
  }, [samples])

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
