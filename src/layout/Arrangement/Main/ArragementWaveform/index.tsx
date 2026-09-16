import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { appWidth, arrangementPlayHead, arrangementSidebarWidth } from '../../../../lib/consts'
import { SelectedBar, Playing, NumBars } from '../../../../lib/store'

const waveformWidth = appWidth - arrangementSidebarWidth - 1

export const ArragementWaveform = () => {
  const selectedBar = SelectedBar.useState()
  const numBars = NumBars.useState()
  const isPlaying = Playing.useState()
  const samples = useArrangementSamples({ bar: selectedBar })

  if (!samples) return null

  return (
    <Waveform
      playHeadId={arrangementPlayHead}
      samples={samples}
      width={waveformWidth}
      height={166}
      offset={0}
      scaleX={1}
      slices={[]}
      useLoopPosition
      isPlaying={isPlaying}
      resetTrigger={selectedBar}
      selectedBarIndex={selectedBar}
      totalBars={numBars}
    />
  )
}
