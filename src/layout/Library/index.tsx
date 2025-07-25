import styled from 'styled-components'
import { FileList } from './FileList'
import { VDivider } from '../../components/Dividers'

export const Library = () => {
  return (
    <LibraryStyle>
      <FileList />
      <VDivider />
    </LibraryStyle>
  )
}

const LibraryStyle = styled('div')`
  display: flex;
`
