import styled from 'styled-components'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'
import { colors } from '../../../../lib/colors'
import { Fragment } from 'react/jsx-runtime'
import { Arrangement } from '../../../../lib/store'
import type { Note as NoteStyle } from '../../../../lib/types'
import { restartPlayback } from '../../../../actions/restartPlayback'

const gridWidth = appWidth - arrangementSidebarWidth - 1
const gridHeight = 400
const cellWidth = gridWidth / 16
const cellHeight = gridHeight / 16

export const Grid = () => {
  const arrangement = Arrangement.useState()

  const handleAddNote = (note: NoteStyle) => {
    Arrangement.set([...arrangement.filter(n => n.startStep !== note.startStep), note])
    restartPlayback()
  }

  const handleRemoveNote = (note: NoteStyle) => {
    Arrangement.set([
      ...arrangement.filter(
        n => !(n.stepNumToPlay === note.stepNumToPlay && n.startStep === note.startStep)
      ),
    ])
    restartPlayback()
  }

  return (
    <GridStyle>
      {Array.from({ length: 16 }).map((_, i) =>
        Array.from({ length: 16 }).map((_, j) => (
          <Clickable
            key={j}
            style={{ bottom: i * cellHeight - 0.5, left: j * cellWidth + 0.5 }}
            onClick={() => handleAddNote({ stepNumToPlay: i, startStep: j })}
          />
        ))
      )}
      {Array.from({ length: 15 }).map((_, index) => (
        <Fragment key={index + 'lines'}>
          <HLine style={{ top: (index + 1) * cellHeight }} />
          <VLine style={{ left: (index + 1) * cellWidth }} />
        </Fragment>
      ))}
      {arrangement.map(({ stepNumToPlay, startStep }) => (
        <NoteStyle
          key={stepNumToPlay + '-' + startStep + 'note'}
          onClick={() => handleRemoveNote({ stepNumToPlay, startStep })}
          style={{ bottom: stepNumToPlay * cellHeight - 0.5, left: startStep * cellWidth + 0.5 }}
        ></NoteStyle>
      ))}
    </GridStyle>
  )
}

const GridStyle = styled('div')`
  position: relative;
  width: ${gridWidth}px;
  height: ${gridHeight}px;
  background-color: ${colors.white};
  overflow-x: auto;
`

const NoteStyle = styled('div')`
  position: absolute;
  width: ${cellWidth}px;
  height: ${cellHeight}px;
  background-color: ${colors.black};
  border-radius: 3px;
  color: ${colors.white};
  cursor: pointer;
`

const Clickable = styled('div')`
  position: absolute;
  width: ${cellWidth}px;
  height: ${cellHeight}px;
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
