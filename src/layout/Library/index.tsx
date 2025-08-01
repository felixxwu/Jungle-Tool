import styled from 'styled-components'
import { FileList } from './FileList'
import { VDivider } from '../../components/Dividers'
import { FileEditor } from './FileEditor'
import { SelectedFileIndex, WindowSize } from '../../lib/store'
import { appWidth } from '../../lib/consts'

export const Library = () => {
  const windowSize = WindowSize.useState()
  const selectedFileIndex = SelectedFileIndex.useState()

  if (windowSize.width < appWidth) {
    return (
      <LibraryMobileStyle>
        {selectedFileIndex === null ? <FileList /> : <FileEditor />}
      </LibraryMobileStyle>
    )
  }

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
  overflow-y: auto;
  height: 100%;
`

const LibraryMobileStyle = styled('div')`
  display: flex;
  overflow-y: auto;
  height: 100%;
  flex-direction: column;
`
