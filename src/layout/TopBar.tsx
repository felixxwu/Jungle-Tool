import { Text } from '../components/Text'
import { VDivider } from '../components/Dividers'
import { Tab } from '../lib/store'
import styled from 'styled-components'
import { colors } from '../lib/colors'

export const TopBar = () => {
  const tab = Tab.useState()

  return (
    <Row>
      <Text
        onClick={() => Tab.set('arrangement')}
        selected={tab === 'arrangement'}
        style={{ height: '35px' }}
      >
        Arrangement
      </Text>
      <VDivider />
      <Text onClick={() => Tab.set('library')} selected={tab === 'library'}>
        Library
      </Text>
      <VDivider />
      <VDivider style={{ marginLeft: 'auto' }} />
      <Logo>
        <img src='/jungletool.svg' alt='logo' width={30} height={30} />
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
  width: 35px;
  height: 35px;
  background-color: ${colors.black};
`
