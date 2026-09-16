import styled from 'styled-components'
import {
  AutoSliceMode,
  EditSliceMode,
  HoveredSliceIndex,
  Layers,
  LoadedFiles,
  Playing,
  ReplaceLayerIndex,
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
import { previewInArrangement } from '../../../actions/previewInArrangement'
import { replaceInArrangement } from '../../../actions/replaceInArrangement'

export const FileList = () => {
  const loadedFiles = LoadedFiles.useState()
  const selectedFile = SelectedFileIndex.useState()
  const replaceLayerIndex = ReplaceLayerIndex.useState()
  const layers = Layers.useState()

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

    if (Playing.ref()) {
      previewInArrangement(index)
    } else {
      await playFile(index)
    }
  }

  const handleClick = (index: number) => {
    if (replaceLayerIndex !== null) {
      setLocalSelectedFile(index)
      replaceInArrangement(replaceLayerIndex, index)
    } else {
      handleSelectFile(index)
    }
  }

  return (
    <FileListStyle style={windowSize.width < appWidth ? { width: '100%' } : {}}>
      <Scrollable>
        {replaceLayerIndex !== null && (
          <>
            <Text>Choose a replacement:</Text>
            <HDivider />
          </>
        )}
        {loadedFiles
          .sort((a, b) => b.whosampledCount - a.whosampledCount)
          .map((file, index) => (
            <Fragment key={file.name}>
              {index !== 0 && <HDivider />}
              <Text
                onClick={() => handleClick(index)}
                selected={
                  localSelectedFile === index ||
                  (replaceLayerIndex !== null && layers[replaceLayerIndex]?.filename === file.name)
                }
              >
                <FileListItemStyle>
                  <div>{file.name}</div>
                  <ArtistAndYear>
                    <div>{file.artist || '??'}</div>
                    <div>{file.year || '??'}</div>
                  </ArtistAndYear>
                </FileListItemStyle>
              </Text>
            </Fragment>
          ))}
      </Scrollable>
      <HDivider />
      <Text onClick={importFile} big>
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
