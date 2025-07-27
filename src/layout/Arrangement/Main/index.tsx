import styled from 'styled-components'
import { Grid } from './Grid'
import { HDivider } from '../../../components/Dividers'
import { ArragementWaveform } from './ArragementWaveform'
import { BottomBar } from './BottomBar'
import { appWidth, arrangementSidebarWidth } from '../../../lib/consts'

const gridWidth = appWidth - arrangementSidebarWidth - 1

export const Main = () => {
  return (
    <MainStyle>
      <Scrollable>
        <Grid />
        <HDivider style={{ width: `${gridWidth}px` }} />
        <ArragementWaveform />
      </Scrollable>
      <HDivider />
      <BottomBar />
    </MainStyle>
  )
}

const MainStyle = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`

const Scrollable = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-x: auto;
`
