import styled from 'styled-components'
import { AutoSliceMode, EditSliceMode, LoadedFiles, SelectedFileIndex } from '../../../lib/store'
import { Slice } from './Slice'
import { Text } from '../../../components/Text'
import { HDivider } from '../../../components/Dividers'
import { stereoSlice } from '../../../lib/audio'
import { autoSlice } from '../../../actions/autoSlice'
import { stopPlayback } from '../../../lib/playback'

export const TrimEditor = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()

  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]

  const handleTrim = () => {
    const start = selectedFile.slices.find(slice => slice.type === 'Start')?.start || 0
    const end =
      selectedFile.slices.find(slice => slice.type === 'End')?.start ||
      selectedFile.samples[0].length
    const trimmedFile = stereoSlice(selectedFile.samples, start, end)
    selectedFile.samples = trimmedFile
    selectedFile.slices = []
    LoadedFiles.set([...loadedFiles])
    stopPlayback() // Stop playback and clear state after trimming file
    EditSliceMode.set(true)
    AutoSliceMode.set(true)
    autoSlice()
  }

  return (
    <>
      <Text>Adjust start and end to create a seamless loop</Text>
      <HDivider />
      <Slices>
        {selectedFile.slices.map((slice, index) => (
          <Slice
            key={slice.start + '-' + slice.type + '-' + index}
            sliceIndex={index}
            forceEditSliceMode
          />
        ))}
        <Text onClick={handleTrim}>Trim and continue ›</Text>
        <HDivider />
      </Slices>
    </>
  )
}

const Slices = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`
