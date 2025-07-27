import styled from 'styled-components'
import { VDivider } from '../../components/Dividers'
import { Sidebar } from './Sidebar'
import { Main } from './Main'
import { WindowSize } from '../../lib/store'
import { Text } from '../../components/Text'

export const Arrangement = () => {
  const windowSize = WindowSize.useState()

  if (windowSize.width < 768) {
    return (
      <ArrangementMobileStyle>
        <Text>Edit</Text>
        <Main />
        <VDivider style={{ marginLeft: 'auto' }} />
        <Sidebar />
      </ArrangementMobileStyle>
    )
  }

  return (
    <ArrangementStyle>
      <Main />
      <VDivider style={{ marginLeft: 'auto' }} />
      <Sidebar />
    </ArrangementStyle>
  )
}

const ArrangementStyle = styled('div')`
  display: flex;
  height: 100%;
`

const ArrangementMobileStyle = styled('div')`
  display: flex;
  flex-direction: column;
  height: 100%;
`
