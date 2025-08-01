import styled from 'styled-components'
import { BPMSlider } from './BPMSlider'
import { LayerControls } from './LayerControls'
import { appWidth, arrangementSidebarWidth } from '../../../lib/consts'
import { Tab, WindowSize } from '../../../lib/store'
import { SwingSlider } from './SwingSlider'
import { BottomBar } from '../Main/BottomBar'
import { HDivider } from '../../../components/Dividers'
import { NoteLengthSlider } from './NoteLengthSlider'
import { FadeOutSlider } from './FadeOutSlider'
import { SaturationSlider } from './SaturationSlider'

export const Sidebar = () => {
  const windowSize = WindowSize.useState()
  const collapsed = windowSize.width < appWidth - arrangementSidebarWidth
  const tab = Tab.useState()

  if (!collapsed && tab === 'layers') {
    Tab.set('arrangement')
  }

  return (
    <SidebarStyle style={collapsed ? { width: '100vw' } : {}}>
      <LayerControls />
      <BPMSlider />
      <SwingSlider />
      <SaturationSlider />
      <NoteLengthSlider />
      <FadeOutSlider />

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
