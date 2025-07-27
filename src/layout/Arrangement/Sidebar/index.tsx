import styled from 'styled-components'
import { BPMSlider } from './BPMSlider'
import { LayerControls } from './LayerControls'
import { arrangementSidebarWidth } from '../../../lib/consts'

export const Sidebar = () => {
  return (
    <SidebarStyle>
      <BPMSlider />
      <LayerControls />
    </SidebarStyle>
  )
}

const SidebarStyle = styled('div')`
  display: flex;
  flex-direction: column;
  width: ${arrangementSidebarWidth}px;
  height: 100%;
`
