import styled from 'styled-components'
import { VDivider } from '../../components/Dividers'
import { Sidebar } from './Sidebar'
import { Main } from './Main'
import { WindowSize } from '../../lib/store'
import { appWidth, arrangementSidebarWidth } from '../../lib/consts'

export const ArrangementView = () => {
  const windowSize = WindowSize.useState()
  const showSidebar = windowSize.width > appWidth - arrangementSidebarWidth

  return (
    <ArrangementStyle>
      <Main />
      {showSidebar && (
        <>
          <VDivider style={{ marginLeft: 'auto' }} />
          <Sidebar />
        </>
      )}
    </ArrangementStyle>
  )
}

const ArrangementStyle = styled('div')`
  display: flex;
  height: 100%;
  overflow-y: auto;
`
