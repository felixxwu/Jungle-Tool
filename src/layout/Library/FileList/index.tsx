import styled from 'styled-components'
import {
  AutoSliceMode,
  EditSliceMode,
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
} from '../../../lib/store'
import { Text } from '../../../components/Text'
import { HDivider } from '../../../components/Dividers'
import { colors } from '../../../lib/colors'
import { librarySidebarWidth } from '../../../lib/consts'
import { playFile } from '../../../actions/playFile'

export const FileList = () => {
  const loadedFiles = LoadedFiles.useState()
  const selectedFile = SelectedFileIndex.useState()

  const handleSelectFile = async (index: number) => {
    SelectedFileIndex.set(index)
    SelectedSliceIndex.set(null)
    AutoSliceMode.set(false)
    EditSliceMode.set(false)

    await playFile(index)
  }

  return (
    <FileListStyle>
      {loadedFiles.map((file, index) => (
        <>
          <Text
            key={file.path}
            onClick={() => handleSelectFile(index)}
            selected={selectedFile === index}
          >
            <FileListItemStyle>
              <div>{file.name}</div>
              <ArtistAndYear>
                <div>{file.artist}</div>
                <div>{file.year}</div>
              </ArtistAndYear>
            </FileListItemStyle>
          </Text>
          <HDivider />
        </>
      ))}
    </FileListStyle>
  )
}

const FileListStyle = styled('div')`
  display: flex;
  flex-direction: column;
  min-width: ${librarySidebarWidth}px;
`

const FileListItemStyle = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const ArtistAndYear = styled('div')`
  width: 100%;
  color: ${colors.darkGrey};
  display: flex;
  justify-content: space-between;
`
