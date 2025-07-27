import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { mono } from '../../../../lib/audio'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'

const waveformWidth = appWidth - arrangementSidebarWidth - 1

export const ArragementWaveform = () => {
  const samples = useArrangementSamples()
  if (!samples) return null

  const monoSamples = mono(samples)

  return (
    <Waveform
      samples={monoSamples}
      width={waveformWidth}
      height={150}
      offset={0}
      scaleX={1}
      slices={[]}
    />
  )
}
