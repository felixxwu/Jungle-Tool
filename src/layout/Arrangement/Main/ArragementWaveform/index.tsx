import styled from 'styled-components'
import { Waveform } from '../../../../components/Waveform'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'
import { appWidth, arrangementPlayHead, arrangementSidebarWidth } from '../../../../lib/consts'
import { SelectedBar, Playing, NumBars } from '../../../../lib/store'

const waveformWidth = appWidth - arrangementSidebarWidth - 1
const waveformHeight = 166

export const ArragementWaveform = () => {
  const selectedBar = SelectedBar.useState()
  const numBars = NumBars.useState()
  const isPlaying = Playing.useState()

  return (
    <ViewportStyle>
      <TrackStyle
        style={{
          width: waveformWidth * numBars,
          transform: `translateX(-${selectedBar * waveformWidth}px)`,
        }}
      >
        {Array.from({ length: numBars }).map((_, bar) => (
          <BarWaveform
            key={bar}
            bar={bar}
            numBars={numBars}
            selectedBar={selectedBar}
            isPlaying={isPlaying}
          />
        ))}
      </TrackStyle>
    </ViewportStyle>
  )
}

const BarWaveform = (p: {
  bar: number
  numBars: number
  selectedBar: number
  isPlaying: boolean
}) => {
  const samples = useArrangementSamples({ bar: p.bar })

  if (!samples) return null

  return (
    <BarStyle style={{ left: p.bar * waveformWidth }}>
      <Waveform
        playHeadId={`${arrangementPlayHead}-${p.bar}`}
        samples={samples}
        width={waveformWidth}
        height={waveformHeight}
        offset={0}
        scaleX={1}
        slices={[]}
        useLoopPosition
        isPlaying={p.isPlaying}
        resetTrigger={p.selectedBar}
        selectedBarIndex={p.bar}
        totalBars={p.numBars}
      />
    </BarStyle>
  )
}

const ViewportStyle = styled('div')`
  width: ${waveformWidth}px;
  height: ${waveformHeight}px;
  overflow: hidden;
`

const TrackStyle = styled('div')`
  position: relative;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.83, 0, 0.17, 1);
`

const BarStyle = styled('div')`
  position: absolute;
  top: 0;
`
