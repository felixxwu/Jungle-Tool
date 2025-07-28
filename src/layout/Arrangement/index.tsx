import styled from 'styled-components'
import { HDivider, VDivider } from '../../components/Dividers'
import { Sidebar } from './Sidebar'
import { Main } from './Main'
import { ArrangementSidebarOpen, WindowSize } from '../../lib/store'
import { Text } from '../../components/Text'
import { appWidth, arrangementSidebarWidth, largeTextHeight } from '../../lib/consts'

export const Arrangement = () => {
  const windowSize = WindowSize.useState()
  const arrangementSidebarOpen = ArrangementSidebarOpen.useState()

  if (windowSize.width < appWidth - arrangementSidebarWidth) {
    return (
      <ArrangementMobileStyle>
        <Text
          style={{ height: largeTextHeight }}
          onClick={() => ArrangementSidebarOpen.set(!arrangementSidebarOpen)}
        >
          {arrangementSidebarOpen ? '‹ Back' : 'Edit layers / BPM ›'}
        </Text>
        <HDivider />
        {arrangementSidebarOpen ? <Sidebar /> : <Main />}
      </ArrangementMobileStyle>
    )
  }

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

const ArrangementMobileStyle = styled('div')`
  display: flex;
  flex-direction: column;
  height: 100%;
`
