import styled from 'styled-components'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'
import { colors } from '../../../../lib/colors'
import { Arrangement, NumBars, SelectedBar, Swing } from '../../../../lib/store'
import type { Note as NoteStyle } from '../../../../lib/types'

const gridWidth = appWidth - arrangementSidebarWidth - 2
const gridHeight = 375
const cellWidth = gridWidth / 16
const cellHeight = gridHeight / 16

export const Grid = () => {
  const arrangement = Arrangement.useState()
  const swing = Swing.useState()
  const selectedBar = SelectedBar.useState()
  const numBars = NumBars.useState()

  const totalSteps = numBars * 16

  const handleAddNote = (note: NoteStyle) => {
    const alreadyExists = Arrangement.ref().some(
      n => n.stepNumToPlay === note.stepNumToPlay && n.startStep === note.startStep
    )
    if (alreadyExists) return
    Arrangement.set([...Arrangement.ref(), note])
  }

  const handleRemoveNote = (note: NoteStyle) => {
    Arrangement.set([
      ...Arrangement.ref().filter(
        n => !(n.stepNumToPlay === note.stepNumToPlay && n.startStep === note.startStep)
      ),
    ])
  }

  const getSwingOffset = (index: number) => {
    if (index % 2 === 1) return 0
    return (swing / 100) * cellWidth
  }

  return (
    <GridStyle data-testid='grid'>
      <Track
        style={{
          width: totalSteps * cellWidth,
          transform: `translateX(-${selectedBar * gridWidth}px)`,
        }}
      >
        {Array.from({ length: 16 }).map((_, i) =>
          Array.from({ length: totalSteps }).map((_, step) => (
            <Clickable
              key={step}
              data-testid={`grid-cell-${i}-${step}`}
              style={{
                bottom: i * cellHeight - 0.5,
                left: step * cellWidth + 0.5 + getSwingOffset(step + 1),
                width: cellWidth + getSwingOffset(step) - getSwingOffset(step + 1),
              }}
              onClick={() => handleAddNote({ stepNumToPlay: i, startStep: step })}
            >
              {i === 0 && 'K'}
              {i === 4 && 'S'}
              {i === 10 && 'K'}
              {i === 12 && 'S'}
            </Clickable>
          ))
        )}
        {Array.from({ length: 15 }).map((_, index) => (
          <HLine key={index + 'hline'} style={{ top: (index + 1) * cellHeight }} />
        ))}
        {Array.from({ length: totalSteps - 1 }).map((_, index) => (
          <VLine
            key={index + 'vline'}
            style={{ left: (index + 1) * cellWidth + getSwingOffset(index) }}
          />
        ))}
        {arrangement.map(({ stepNumToPlay, startStep }, i) => (
          <NoteStyle
            key={stepNumToPlay + '-' + startStep + '-' + i}
            data-testid={`grid-note-${stepNumToPlay}-${startStep}`}
            onClick={() => handleRemoveNote({ stepNumToPlay, startStep })}
            style={{
              bottom: stepNumToPlay * cellHeight - 0.5,
              left: startStep * cellWidth + 0.5 + getSwingOffset(startStep + 1),
              width: cellWidth + getSwingOffset(startStep) - getSwingOffset(startStep + 1),
            }}
          >
            {stepNumToPlay === 0 && 'K'}
            {stepNumToPlay === 4 && 'S'}
            {stepNumToPlay === 10 && 'K'}
            {stepNumToPlay === 12 && 'S'}
          </NoteStyle>
        ))}
      </Track>
    </GridStyle>
  )
}

const GridStyle = styled('div')`
  position: relative;
  width: ${gridWidth}px;
  height: ${gridHeight}px;
  background-color: ${colors.white};
  overflow: hidden;
`

const Track = styled('div')`
  position: relative;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.83, 0, 0.17, 1);
`

const NoteStyle = styled('div')`
  position: absolute;
  width: ${cellWidth}px;
  height: ${cellHeight}px;
  background-color: ${colors.black};
  border-radius: 3px;
  color: ${colors.white};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #555;
  }
`

const Clickable = styled('div')`
  position: absolute;
  height: ${cellHeight}px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.grey};
  cursor: pointer;

  &:hover {
    background-color: ${colors.grey};
  }
`

const HLine = styled('div')`
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: ${colors.grey};
`

const VLine = styled('div')`
  position: absolute;
  width: 1px;
  height: ${gridHeight}px;
  background-color: ${colors.grey};
`
