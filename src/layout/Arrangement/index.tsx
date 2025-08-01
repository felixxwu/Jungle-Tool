import styled from 'styled-components'
import { HDivider, VDivider } from '../../components/Dividers'
import { Sidebar } from './Sidebar'
import { Main } from './Main'
import { ArrangementSidebarOpen, WindowSize } from '../../lib/store'
import { Text } from '../../components/Text'
import { appWidth, arrangementSidebarWidth } from '../../lib/consts'

export const Arrangement = () => {
  const windowSize = WindowSize.useState()
  const arrangementSidebarOpen = ArrangementSidebarOpen.useState()

  if (windowSize.width < appWidth - arrangementSidebarWidth) {
    return (
      <ArrangementMobileStyle>
        <Text big onClick={() => ArrangementSidebarOpen.set(!arrangementSidebarOpen)}>
          {arrangementSidebarOpen ? '‹ Back' : 'Edit layers / BPM ›'}
        </Text>
        <HDivider />
        <ArrangementMobileStyle style={{ display: arrangementSidebarOpen ? 'flex' : 'none' }}>
          <Sidebar />
        </ArrangementMobileStyle>
        <ArrangementMobileStyle style={{ display: arrangementSidebarOpen ? 'none' : 'flex' }}>
          <Main />
        </ArrangementMobileStyle>
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
  overflow-y: auto;
`

const ArrangementMobileStyle = styled('div')`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`
