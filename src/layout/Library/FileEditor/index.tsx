import styled from 'styled-components'
import { LoadedFiles, SelectedFileIndex } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { LibraryWaveform } from './LibraryWaveform'
import { TrimEditor } from './TrimEditor'
import { SliceEditor } from './SliceEditor'

export const FileEditor = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]
  const trimMode = selectedFile.slices.find(slice => slice.type === 'Start' || slice.type === 'End')

  return (
    <FileEditorStyle>
      <LibraryWaveform />
      <HDivider />
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
