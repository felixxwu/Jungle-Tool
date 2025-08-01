import { Text } from '../components/Text'
import { VDivider } from '../components/Dividers'
import { AddLayerMode, LibraryLoading, SelectedFileIndex, Tab, WindowSize } from '../lib/store'
import styled from 'styled-components'
import { colors } from '../lib/colors'
import { appWidth, arrangementSidebarWidth, largeTextHeight } from '../lib/consts'
import { useDebouncedLocalState } from '../hooks/useDebouncedLocalState'
import type { ITab } from '../lib/types'

export const TopBar = () => {
  const tab = Tab.useState()
  const libraryLoading = LibraryLoading.useState()
  const windowSize = WindowSize.useState()
  const collapsed = windowSize.width < appWidth - arrangementSidebarWidth

  const [localTab, setLocalTab] = useDebouncedLocalState(tab, Tab.set, 10)

  const handleSelectTab = (tab: ITab) => {
    SelectedFileIndex.set(null)
    AddLayerMode.set(false)
    setLocalTab(tab)
  }

  return (
    <Row>
      <Text
        onClick={() => handleSelectTab('arrangement')}
        selected={localTab === 'arrangement'}
        big
      >
        Arrangement
      </Text>
      {collapsed && (
        <>
          <VDivider />
          <Text onClick={() => handleSelectTab('layers')} selected={localTab === 'layers'} big>
            Layers
          </Text>
        </>
      )}
      <VDivider />
      <Text onClick={() => handleSelectTab('library')} selected={localTab === 'library'}>
        {libraryLoading ? ' Loading...' : 'Library'}
      </Text>
      <VDivider />
      <VDivider style={{ marginLeft: 'auto' }} />
      <Logo>
        <img src='/jungletool-white.svg' alt='logo' width={30} height={30} />
      </Logo>
    </Row>
  )
}

const Row = styled('div')`
  display: flex;
`

const Logo = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${largeTextHeight}px;
  height: ${largeTextHeight}px;
  background-color: ${colors.black};
`
