import styled from 'styled-components'
import { BPMSlider } from './BPMSlider'
import { LayerControls } from './LayerControls'
import { appWidth, arrangementSidebarWidth } from '../../../lib/consts'
import { ShortenNotes, Tab, WindowSize } from '../../../lib/store'
import { SwingSlider } from './SwingSlider'
import { BottomBar } from '../Main/BottomBar'
import { HDivider } from '../../../components/Dividers'
import { NoteLengthSlider } from './NoteLengthSlider'
import { FadeOutSlider } from './FadeOutSlider'
import { SaturationSlider } from './SaturationSlider'
import { FillGapsToggle } from './FillGapsToggle'
import { ShortenNotesToggle } from './ShortenNotesToggle'

export const Sidebar = () => {
  const windowSize = WindowSize.useState()
  const collapsed = windowSize.width < appWidth - arrangementSidebarWidth
  const tab = Tab.useState()
  const shortenNotes = ShortenNotes.useState()

  if (!collapsed && tab === 'layers') {
    Tab.set('arrangement')
  }

  return (
    <SidebarStyle style={collapsed ? { width: '100vw' } : {}}>
      <LayerControls />
      <BPMSlider />
      <SwingSlider />
      <SaturationSlider />
      <ShortenNotesToggle />
      {shortenNotes && (
        <>
          <NoteLengthSlider />
          <FadeOutSlider />
        </>
      )}
      <FillGapsToggle />

      {collapsed && (
        <>
          <HDivider />
          <BottomBar />
        </>
      )}
    </SidebarStyle>
  )
}

const SidebarStyle = styled('div')`
  display: flex;
  flex-direction: column;
  width: ${arrangementSidebarWidth}px;
  height: 100%;
  overflow-y: auto;
`
