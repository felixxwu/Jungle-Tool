import { Text } from '../components/Text'
import { VDivider } from '../components/Dividers'
import { ArrangementSidebarOpen, LibraryLoading, SelectedFileIndex, Tab } from '../lib/store'
import styled from 'styled-components'
import { colors } from '../lib/colors'
import { largeTextHeight } from '../lib/consts'
import { useDebouncedLocalState } from '../hooks/useDebouncedLocalState'

export const TopBar = () => {
  const tab = Tab.useState()
  const libraryLoading = LibraryLoading.useState()

  const [localTab, setLocalTab] = useDebouncedLocalState(tab, Tab.set, 10)

  return (
    <Row>
      <Text
        onClick={() => {
          ArrangementSidebarOpen.set(false)
          setLocalTab('arrangement')
        }}
        selected={localTab === 'arrangement'}
        big
      >
        Arrangement
      </Text>
      <VDivider />
      <Text
        onClick={() => {
          SelectedFileIndex.set(null)
          setLocalTab('library')
        }}
        selected={localTab === 'library'}
      >
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
