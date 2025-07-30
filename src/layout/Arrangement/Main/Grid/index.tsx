import styled from 'styled-components'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'
import { colors } from '../../../../lib/colors'
import { Fragment } from 'react/jsx-runtime'
import { Arrangement, SelectedBar, Swing } from '../../../../lib/store'
import type { Note as NoteStyle } from '../../../../lib/types'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'

const gridWidth = appWidth - arrangementSidebarWidth - 2
const gridHeight = 375
const cellWidth = gridWidth / 16
const cellHeight = gridHeight / 16

export const Grid = () => {
  const arrangement = Arrangement.useState()
  const swing = Swing.useState()
  const selectedBar = SelectedBar.useState()

  const [localArrangement, setLocalArrangement] = useDebouncedLocalState(
    arrangement,
    Arrangement.set,
    10
  )
  const arrangementForThisBar = localArrangement.filter(
    n => n.startStep < (selectedBar + 1) * 16 && n.startStep >= selectedBar * 16
  )
  const barOffset = selectedBar * gridWidth

  const handleAddNote = (note: NoteStyle) => {
    setLocalArrangement([...localArrangement.filter(n => n.startStep !== note.startStep), note])
  }

  const handleRemoveNote = (note: NoteStyle) => {
    setLocalArrangement([
      ...localArrangement.filter(
        n => !(n.stepNumToPlay === note.stepNumToPlay && n.startStep === note.startStep)
      ),
    ])
  }

  const getSwingOffset = (index: number) => {
    if (index % 2 === 1) return 0
    return (swing / 100) * cellWidth
  }

  return (
    <GridStyle>
      {Array.from({ length: 16 }).map((_, i) =>
        Array.from({ length: 16 }).map((_, j) => (
          <Clickable
            key={j}
            style={{
              bottom: i * cellHeight - 0.5,
              left: j * cellWidth + 0.5 + getSwingOffset(j + 1),
              width: cellWidth + getSwingOffset(j) - getSwingOffset(j + 1),
            }}
            onClick={() => handleAddNote({ stepNumToPlay: i, startStep: j + selectedBar * 16 })}
          >
            {i === 0 && 'K'}
            {i === 4 && 'S'}
            {i === 10 && 'K'}
            {i === 12 && 'S'}
          </Clickable>
        ))
      )}
      {Array.from({ length: 15 }).map((_, index) => (
        <Fragment key={index + 'lines'}>
          <HLine style={{ top: (index + 1) * cellHeight }} />
          <VLine style={{ left: (index + 1) * cellWidth + getSwingOffset(index) }} />
        </Fragment>
      ))}
      {arrangementForThisBar.map(({ stepNumToPlay, startStep }, i) => (
        <NoteStyle
          key={stepNumToPlay + '-' + startStep + '-' + i}
          onClick={() => handleRemoveNote({ stepNumToPlay, startStep })}
          style={{
            bottom: stepNumToPlay * cellHeight - 0.5,
            left: startStep * cellWidth + 0.5 + getSwingOffset(startStep + 1) - barOffset,
            width: cellWidth + getSwingOffset(startStep) - getSwingOffset(startStep + 1),
          }}
        >
          {stepNumToPlay === 0 && 'K'}
          {stepNumToPlay === 4 && 'S'}
          {stepNumToPlay === 10 && 'K'}
          {stepNumToPlay === 12 && 'S'}
        </NoteStyle>
      ))}
    </GridStyle>
  )
}

const GridStyle = styled('div')`
  position: relative;
  width: ${gridWidth}px;
  height: ${gridHeight}px;
  background-color: ${colors.white};
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
`

const Clickable = styled('div')`
  position: absolute;
  height: ${cellHeight}px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.grey};
`

const HLine = styled('div')`
  position: absolute;
  width: ${gridWidth}px;
  height: 1px;
  background-color: ${colors.grey};
`

const VLine = styled('div')`
  position: absolute;
  width: 1px;
  height: ${gridHeight}px;
  background-color: ${colors.grey};
`
