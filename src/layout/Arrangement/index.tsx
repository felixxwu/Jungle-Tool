import styled from 'styled-components'
import { Text } from '../../components/Text'
import { VDivider } from '../../components/Dividers'
import { Sidebar } from './Sidebar'

export const Arrangement = () => {
  return (
    <ArrangementStyle>
      <Text>Arrangement</Text>
      <VDivider />
      <VDivider style={{ marginLeft: 'auto' }} />
      <Sidebar />
    </ArrangementStyle>
  )
}

const ArrangementStyle = styled('div')`
  display: flex;
`
