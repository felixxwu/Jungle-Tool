import styled from 'styled-components'
import { Text } from '../components/Text'
import { VDivider } from '../components/Dividers'
import { Tab } from '../lib/store'

export const TopBar = () => {
  const tab = Tab.useState()

  return (
    <TopBarStyle>
      <Text onClick={() => Tab.set('arrangement')} selected={tab === 'arrangement'}>
        Arrangement
      </Text>
      <VDivider />
      <Text onClick={() => Tab.set('library')} selected={tab === 'library'}>
        Library
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
