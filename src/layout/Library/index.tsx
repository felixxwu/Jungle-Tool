import styled from 'styled-components'
import { FileList } from './FileList'
import { VDivider } from '../../components/Dividers'
import { FileEditor } from './FileEditor'

export const Library = () => {
  return (
    <LibraryStyle>
      <FileList />
      <VDivider />
      <FileEditor />
    </LibraryStyle>
  )
}

const LibraryStyle = styled('div')`
  display: flex;
`
