import styled from 'styled-components'
import { LoadedFiles, SelectedFileIndex } from '../../../lib/store'
import type { SliceType } from '../../../lib/types'
import { HDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { Slice } from './Slice'
import { Waveform } from './Waveform'

export const FileEditor = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()

  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]

  const handleAddSlice = () => {
    const lastSlice = selectedFile.slices[selectedFile.slices.length - 1]
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices.push({
      start: lastSlice?.start ? lastSlice.start + 5000 : 0,
      type: 'Kick' as SliceType,
    })
    LoadedFiles.set(newLoadedFiles)
  }

  return (
    <FileEditorStyle>
      <Waveform />
      <HDivider />
      <Text>Slices:</Text>
      <HDivider />
      {selectedFile.slices.map((slice, index) => (
        <Slice key={slice.start + '-' + slice.type + '-' + index} sliceIndex={index} />
      ))}
      <Text onClick={handleAddSlice}>+</Text>
      <HDivider />
    </FileEditorStyle>
  )
}

const FileEditorStyle = styled('div')`
  display: flex;
  flex-direction: column;
`
