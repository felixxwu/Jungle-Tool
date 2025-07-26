import styled from 'styled-components'
import {
  AutoSliceMode,
  EditSliceMode,
  HoveredSliceIndex,
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
} from '../../../lib/store'
import { Text } from '../../../components/Text'
import { HDivider } from '../../../components/Dividers'
import { colors } from '../../../lib/colors'
import { librarySidebarWidth } from '../../../lib/consts'
import { playFile } from '../../../actions/playFile'
import { importFile } from '../../../actions/importFile'
import { Fragment } from 'react/jsx-runtime'

export const FileList = () => {
  const loadedFiles = LoadedFiles.useState()
  const selectedFile = SelectedFileIndex.useState()

  const handleSelectFile = async (index: number) => {
    SelectedFileIndex.set(index)
    SelectedSliceIndex.set(null)
    AutoSliceMode.set(false)
    EditSliceMode.set(false)
    HoveredSliceIndex.set(null)

    await playFile(index)
  }

  return (
    <FileListStyle>
      <Scrollable>
        {loadedFiles.map((file, index) => (
          <Fragment key={file.path}>
            <Text onClick={() => handleSelectFile(index)} selected={selectedFile === index}>
              <FileListItemStyle>
                <div>{file.name}</div>
                <ArtistAndYear>
                  <div>{file.artist || '??'}</div>
                  <div>{file.year || '??'}</div>
                </ArtistAndYear>
              </FileListItemStyle>
            </Text>
            <HDivider />
          </Fragment>
        ))}
      </Scrollable>
      <HDivider />
      <Text onClick={importFile}>Import File +</Text>
    </FileListStyle>
  )
}

const FileListStyle = styled('div')`
  display: flex;
  flex-direction: column;
  min-width: ${librarySidebarWidth}px;
  height: 100%;
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

const Scrollable = styled('div')`
  overflow-y: auto;
  height: 100%;
`
