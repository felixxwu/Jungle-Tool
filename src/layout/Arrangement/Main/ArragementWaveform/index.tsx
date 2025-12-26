import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { mono } from '../../../../lib/audio'
import { appWidth, arrangementPlayHead, arrangementSidebarWidth } from '../../../../lib/consts'
import { SelectedBar, BPM, Player, PlayStartTimestamp, NumBars } from '../../../../lib/store'

const waveformWidth = appWidth - arrangementSidebarWidth - 1

export const ArragementWaveform = () => {
  const selectedBar = SelectedBar.useState()
  const bpm = BPM.useState()
  const numBars = NumBars.useState()
  const playStartTimestamp = PlayStartTimestamp.useState()
  const player = Player.useState()
  const samples = useArrangementSamples({ bar: selectedBar })

  if (!samples) return null

  const monoSamples = mono(samples)

  // Calculate bar duration in milliseconds for arrangement playback
  const stepLength = 60 / bpm / 4
  const barDurationMs = 16 * stepLength * 1000

  return (
    <Waveform
      playHeadId={arrangementPlayHead}
      samples={monoSamples}
      width={waveformWidth}
      height={125}
      offset={0}
      scaleX={1}
      slices={[]}
      playStartTimestamp={playStartTimestamp}
      isPlaying={!!playStartTimestamp && player?.state !== 'stopped'}
      resetTrigger={selectedBar}
      selectedBarIndex={selectedBar}
      totalBars={numBars}
      barDuration={barDurationMs}
    />
  )
}
