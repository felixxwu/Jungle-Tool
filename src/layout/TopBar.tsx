import styled from 'styled-components'
import { Text } from '../components/Text'
import { VDivider } from '../components/Dividers'
import { LoadedFiles, Tab } from '../lib/store'

export const TopBar = () => {
  const tab = Tab.useState()
  const loadedFiles = LoadedFiles.useState()

  return (
    <TopBarStyle>
      <Text onClick={() => Tab.set('arrangement')} selected={tab === 'arrangement'}>
        Arrangement
      </Text>
      <VDivider />
      <Text onClick={() => Tab.set('library')} selected={tab === 'library'}>
        Library ({loadedFiles.length})
      </Text>
      <VDivider />
      <VDivider style={{ marginLeft: 'auto' }} />
      <Text disabled>Undo</Text>
      <VDivider />
      <Text disabled>Redo</Text>
      <VDivider />
      <Text>Export</Text>
    </TopBarStyle>
  )
}

const TopBarStyle = styled('div')`
  display: flex;
`
