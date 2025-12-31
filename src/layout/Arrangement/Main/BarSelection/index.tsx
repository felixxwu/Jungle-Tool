import styled, { keyframes, css } from 'styled-components'
import { Text } from '../../../../components/Text'
import {
  Arrangement,
  NumBars,
  SelectedBar,
  BPM,
  Player,
  PlayStartTimestamp,
} from '../../../../lib/store'
import { VDivider } from '../../../../components/Dividers'
import { Fragment } from 'react/jsx-runtime'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'
import { useState, useEffect } from 'react'

export const BarSelection = () => {
  const numBars = NumBars.useState()
  const selectedBar = SelectedBar.useState()
  const bpm = BPM.useState()
  const player = Player.useState()
  const playStartTimestamp = PlayStartTimestamp.useState()
  const isPlaying = !!playStartTimestamp && player?.state !== 'stopped'

  const [localSelectedBar, setLocalSelectedBar] = useDebouncedLocalState(
    selectedBar,
    SelectedBar.set,
    10
  )

  // Calculate bar duration in milliseconds for arrangement playback
  const stepLength = 60 / bpm / 4
  const barDurationMs = 16 * stepLength * 1000

  // Calculate beat duration in milliseconds: 60 seconds / BPM * 1000ms
  const beatDurationMs = (60 / bpm) * 1000 * 2

  // Track which bar is currently playing
  const [currentPlayingBar, setCurrentPlayingBar] = useState<number | null>(null)

  useEffect(() => {
    if (!isPlaying || !playStartTimestamp) {
      setCurrentPlayingBar(null)
      return
    }

    const updatePlayingBar = () => {
      const elapsed = Date.now() - playStartTimestamp
      const arrangementDuration = barDurationMs * numBars
      const playingBar = Math.floor((elapsed % arrangementDuration) / barDurationMs)
      setCurrentPlayingBar(playingBar)
    }

    updatePlayingBar()
    const intervalId = setInterval(updatePlayingBar, 16) // 60fps

    return () => clearInterval(intervalId)
  }, [isPlaying, playStartTimestamp, barDurationMs, numBars])

  const addBars = () => {
    NumBars.set(numBars + 1)
    setLocalSelectedBar(numBars)
    const firstBar = Arrangement.ref().filter(n => n.startStep < 16)
    const secondBar = Arrangement.ref().filter(n => n.startStep >= 16 && n.startStep < 32)

    if (numBars === 1) {
      Arrangement.set([...firstBar, ...firstBar.map(n => ({ ...n, startStep: n.startStep + 16 }))])
    }
    if (numBars === 2) {
      Arrangement.set([
        ...Arrangement.ref(),
        ...firstBar.map(n => ({ ...n, startStep: n.startStep + 32 })),
      ])
    }
    if (numBars === 3) {
      Arrangement.set([
        ...Arrangement.ref(),
        ...secondBar.map(n => ({ ...n, startStep: n.startStep + 32 })),
      ])
    }
  }

  const removeBars = () => {
    Arrangement.set(Arrangement.ref().slice(0, -16))
    NumBars.set(numBars - 1)
    setLocalSelectedBar(Math.max(localSelectedBar - 1, 0))
  }

  return (
    <BarSelectionStyle>
      {Array.from({ length: numBars }).map((_, i) => (
        <Fragment key={i}>
          <FlashingTextWrapper
            key={playStartTimestamp || `bar-${i}`}
            $isPlaying={isPlaying && currentPlayingBar === i}
            $isSelected={localSelectedBar === i}
            $beatDuration={beatDurationMs}
          >
            <Text big selected={localSelectedBar === i} onClick={() => setLocalSelectedBar(i)}>
              Bar {i + 1}
            </Text>
          </FlashingTextWrapper>
          <VDivider />
        </Fragment>
      ))}
      {numBars > 1 && (
        <>
          <Text onClick={removeBars} big style={{ textTransform: 'lowercase', paddingTop: '4px' }}>
            x
          </Text>
          <VDivider />
        </>
      )}
      {numBars < 4 && (
        <>
          <Text onClick={addBars} big>
            +
          </Text>
          <VDivider />
        </>
      )}
    </BarSelectionStyle>
  )
}

const BarSelectionStyle = styled('div')`
  display: flex;
`

const flashAnimationSelected = keyframes`
  0%, 50% {
    background-color: #555;
  }
  50.01%, 100% {
    background-color: #333;
  }
`

const flashAnimationUnselected = keyframes`
  0%, 50% {
    background-color: #e0e0e0;
  }
  50.01%, 100% {
    background-color: #f7f7f7;
  }
`

const FlashingTextWrapper = styled('div')<{
  $isPlaying: boolean
  $isSelected: boolean
  $beatDuration: number
}>`
  display: inline-block;
  ${p =>
    p.$isPlaying &&
    css`
      & > div {
        animation: ${p.$isSelected ? flashAnimationSelected : flashAnimationUnselected}
          ${p.$beatDuration}ms steps(1, end) infinite;
      }
    `}
`
