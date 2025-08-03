import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { mono } from '../../../../lib/audio'
import { appWidth, arrangementPlayHead, arrangementSidebarWidth } from '../../../../lib/consts'
import { SelectedBar } from '../../../../lib/store'

const waveformWidth = appWidth - arrangementSidebarWidth - 1

export const ArragementWaveform = () => {
  const selectedBar = SelectedBar.useState()
  const samples = useArrangementSamples({ bar: selectedBar })

  if (!samples) return null

  const monoSamples = mono(samples)

  return (
    <Waveform
      playHeadId={arrangementPlayHead}
      samples={monoSamples}
      width={waveformWidth}
      height={125}
      offset={0}
      scaleX={1}
      slices={[]}
    />
  )
}
