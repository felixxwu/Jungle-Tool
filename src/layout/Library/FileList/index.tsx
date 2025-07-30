import styled from 'styled-components'
import {
  AutoSliceMode,
  EditSliceMode,
  HoveredSliceIndex,
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
  WindowSize,
} from '../../../lib/store'
import { Text } from '../../../components/Text'
import { HDivider } from '../../../components/Dividers'
import { colors } from '../../../lib/colors'
import { appWidth, largeTextHeight, librarySidebarWidth } from '../../../lib/consts'
import { playFile } from '../../../actions/playFile'
import { importFile } from '../../../actions/importFile'
import { Fragment } from 'react/jsx-runtime'
import { useDebouncedLocalState } from '../../../hooks/useDebouncedLocalState'

export const FileList = () => {
  const loadedFiles = LoadedFiles.useState()
  const selectedFile = SelectedFileIndex.useState()

  const [localSelectedFile, setLocalSelectedFile] = useDebouncedLocalState(
    selectedFile,
    SelectedFileIndex.set,
    10
  )

  const windowSize = WindowSize.useState()
  const handleSelectFile = async (index: number) => {
    setLocalSelectedFile(index)
    SelectedSliceIndex.set(null)
    AutoSliceMode.set(false)
    EditSliceMode.set(false)
    HoveredSliceIndex.set(null)

    await playFile(index)
  }

  return (
    <FileListStyle style={windowSize.width < appWidth ? { width: '100%' } : {}}>
      <Scrollable>
        {loadedFiles
          .sort((a, b) => a.year - b.year)
          .map((file, index) => (
            <Fragment key={file.name}>
              <Text onClick={() => handleSelectFile(index)} selected={localSelectedFile === index}>
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
      <Text onClick={importFile} style={{ minHeight: largeTextHeight }}>
        Import File +
      </Text>
    </FileListStyle>
  )
}

const FileListStyle = styled('div')`
  display: flex;
  flex-direction: column;
  width: ${librarySidebarWidth}px;
  height: 100%;
`

const FileListItemStyle = styled('div')`
  height: ${largeTextHeight}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 100%;
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
