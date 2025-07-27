import styled from 'styled-components'
import { VDivider } from '../../components/Dividers'
import { Sidebar } from './Sidebar'
import { Main } from './Main'

export const Arrangement = () => {
  return (
    <ArrangementStyle>
      <Main />
      <VDivider style={{ marginLeft: 'auto' }} />
      <Sidebar />
    </ArrangementStyle>
  )
}

const ArrangementStyle = styled('div')`
  display: flex;
  height: 100%;
`
