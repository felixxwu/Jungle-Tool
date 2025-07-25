import styled from 'styled-components'
import { FileList } from './FileList'
import { HDivider, VDivider } from '../../components/Dividers'
import { FileEditor } from './FileEditor'
import { SelectedFileIndex, WindowSize } from '../../lib/store'
import { appWidth } from '../../lib/consts'
import { Text } from '../../components/Text'

export const Library = () => {
  const windowSize = WindowSize.useState()
  const selectedFileIndex = SelectedFileIndex.useState()

  if (windowSize.width < appWidth) {
    return (
      <LibraryMobileStyle>
        {selectedFileIndex === null ? (
          <FileList />
        ) : (
          <>
            <Text onClick={() => SelectedFileIndex.set(null)}>‹ Back</Text>
            <HDivider />
            <FileEditor />
          </>
        )}
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
`

const LibraryMobileStyle = styled('div')`
  display: flex;
  flex-direction: column;
`
