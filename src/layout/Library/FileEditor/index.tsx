import styled from 'styled-components'
import { LoadedFiles, SelectedFileIndex, WindowSize } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { LibraryWaveform } from './LibraryWaveform'
import { TrimEditor } from './TrimEditor'
import { SliceEditor } from './SliceEditor'
import { Text } from '../../../components/Text'
import { appWidth } from '../../../lib/consts'
import { isUntrimmed } from '../../../helpers/isUntrimmed'

export const FileEditor = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const windowSize = WindowSize.useState()

  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]
  const trimMode = isUntrimmed(selectedFile)
  const sidebarOpen = windowSize.width > appWidth

  return (
    <FileEditorStyle>
      <LibraryWaveform />
      <HDivider />
      {!sidebarOpen && (
        <>
          <Text big onClick={() => SelectedFileIndex.set(null)}>
            ‹ Back
          </Text>
          <HDivider />
        </>
      )}
      {trimMode ? <TrimEditor /> : <SliceEditor />}
    </FileEditorStyle>
  )
}

const FileEditorStyle = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`
