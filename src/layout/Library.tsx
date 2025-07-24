import styled from 'styled-components'
import { Text } from '../components/Text'

export const Library = () => {
  return (
    <LibraryStyle>
      <Text onClick={() => {}}>Play</Text>
      <Text onClick={() => {}}>Pause</Text>
    </LibraryStyle>
  )
}

const LibraryStyle = styled('div')`
  display: flex;
`
