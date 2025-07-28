import styled from 'styled-components'
import { BPMSlider } from './BPMSlider'
import { LayerControls } from './LayerControls'
import { appWidth, arrangementSidebarWidth } from '../../../lib/consts'
import { WindowSize } from '../../../lib/store'

export const Sidebar = () => {
  const windowSize = WindowSize.useState()

  return (
    <SidebarStyle
      style={windowSize.width < appWidth - arrangementSidebarWidth ? { width: '100%' } : {}}
    >
      <LayerControls />
      <BPMSlider />
    </SidebarStyle>
  )
}

const SidebarStyle = styled('div')`
  display: flex;
  flex-direction: column;
  width: ${arrangementSidebarWidth}px;
  height: 100%;
`
