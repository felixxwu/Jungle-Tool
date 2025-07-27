import styled from 'styled-components'
import { appWidth, arrangementSidebarWidth } from '../../../../lib/consts'
import { colors } from '../../../../lib/colors'
import { Fragment } from 'react/jsx-runtime'
import { Arrangement } from '../../../../lib/store'

const gridWidth = appWidth - arrangementSidebarWidth - 1
const gridHeight = 350
const cellWidth = gridWidth / 16
const cellHeight = gridHeight / 16

export const Grid = () => {
  const arrangement = Arrangement.useState()

  return (
    <GridStyle>
      {Array.from({ length: 15 }).map((_, index) => (
        <Fragment key={index}>
          <HLine style={{ top: (index + 1) * cellHeight }} />
          <VLine style={{ left: (index + 1) * cellWidth }} />
        </Fragment>
      ))}
      {arrangement.map(({ stepNumToPlay, startStep }) => (
        <Note
          key={stepNumToPlay}
          style={{ bottom: stepNumToPlay * cellHeight - 0.5, left: startStep * cellWidth + 0.5 }}
        />
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

const Note = styled('div')`
  position: absolute;
  width: ${cellWidth}px;
  height: ${cellHeight}px;
  background-color: ${colors.black};
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
