import styled from 'styled-components'
import { Text } from '../components/Text'
import { HDivider, VDivider } from '../components/Dividers'
import { LoadedFiles, Tab, WindowSize } from '../lib/store'

export const TopBar = () => {
  const tab = Tab.useState()
  const loadedFiles = LoadedFiles.useState()
  const windowSize = WindowSize.useState()

  const TopRow = () => (
    <>
      <Text onClick={() => Tab.set('arrangement')} selected={tab === 'arrangement'}>
        Arrangement
      </Text>
      <VDivider />
      <Text onClick={() => Tab.set('library')} selected={tab === 'library'}>
        Library ({loadedFiles.length})
      </Text>
    </>
  )

  const BottomRow = () => (
    <>
      <VDivider style={{ marginLeft: 'auto' }} />
      <Text disabled>Undo</Text>
      <VDivider />
      <Text disabled>Redo</Text>
      <VDivider />
      <Text>Export</Text>
    </>
  )

  if (windowSize.width < 600) {
    return (
      <TopBarStyle>
        <Row>
          <TopRow />
          <VDivider />
        </Row>
        <HDivider />
        <Row>
          <BottomRow />
        </Row>
      </TopBarStyle>
    )
  }

  return (
    <TopBarStyle>
      <Row>
        <TopRow />
        <VDivider />
        <BottomRow />
      </Row>
    </TopBarStyle>
  )
}

const TopBarStyle = styled('div')`
  display: flex;
  flex-direction: column;
`

const Row = styled('div')`
  display: flex;
`
