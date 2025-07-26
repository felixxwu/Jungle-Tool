import styled from 'styled-components'
import {
  AutoSliceMode,
  EditSliceMode,
  LoadedFiles,
  Modal,
  SelectedFileIndex,
} from '../../../lib/store'
import type { SliceType } from '../../../lib/types'
import { HDivider, VDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { Slice } from './Slice'
import { Waveform } from './Waveform'
import { AutoSliceModal } from '../../../modals/AutoSliceModal'
import { SensitivitySlider } from './SensitivitySlider'
import { autoSlice } from '../../../actions/autoSlice'
import { DownloadFileModal } from '../../../modals/DownloadFileModal'

export const FileEditor = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const autoSliceMode = AutoSliceMode.useState()
  const editSliceMode = EditSliceMode.useState()

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

  const handleOpenAutoSliceModal = () => {
    if (selectedFile.slices.length === 0) {
      AutoSliceMode.set(true)
      autoSlice()
    } else {
      Modal.set(<AutoSliceModal />)
    }
  }

  return (
    <FileEditorStyle>
      <Waveform />
      <HDivider />
      {autoSliceMode ? (
        <>
          <Row>
            <Text $fullWidth>Transients Sensitivity:</Text>
            <VDivider />
            <Text onClick={() => AutoSliceMode.set(false)}>Done</Text>
          </Row>
          <HDivider />
          <Row>
            <SensitivitySlider />
          </Row>
        </>
      ) : (
        <Row>
          <Text $fullWidth>Slices:</Text>
          <VDivider />
          {editSliceMode ? (
            <Text onClick={handleOpenAutoSliceModal}>Auto-slice</Text>
          ) : (
            <Text onClick={() => EditSliceMode.set(true)}>Edit</Text>
          )}
          <VDivider />
          <Text onClick={() => Modal.set(<DownloadFileModal />)}>Download</Text>
        </Row>
      )}
      <HDivider />
      <Slices>
        {selectedFile.slices.map((slice, index) => (
          <Slice key={slice.start + '-' + slice.type + '-' + index} sliceIndex={index} />
        ))}
        {editSliceMode && !autoSliceMode && (
          <>
            <Text onClick={handleAddSlice}>+</Text>
            <HDivider />
          </>
        )}
      </Slices>
    </FileEditorStyle>
  )
}

const FileEditorStyle = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`

const Row = styled('div')`
  display: flex;
`

const Slices = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`
