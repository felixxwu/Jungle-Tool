import styled from 'styled-components'
import { BPMSlider } from './BPMSlider'
import { PitchSlider } from './PitchSlider'
import { LayerControls } from './LayerControls'

export const Sidebar = () => {
  return (
    <SidebarStyle>
      <BPMSlider />
      <PitchSlider />
      <LayerControls />
    </SidebarStyle>
  )
}

const SidebarStyle = styled('div')`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 100%;
`
