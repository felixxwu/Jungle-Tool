import styled from 'styled-components'
import { Grid } from './Grid'
import { HDivider } from '../../../components/Dividers'
import { ArragementWaveform } from './ArragementWaveform'
import { BottomBar } from './BottomBar'

export const Main = () => {
  return (
    <MainStyle>
      <Grid />
      <HDivider />
      <ArragementWaveform />
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
