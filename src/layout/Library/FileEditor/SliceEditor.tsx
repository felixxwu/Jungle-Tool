import styled from 'styled-components'
import {
  AutoSliceMode,
  EditSliceMode,
  LoadedFiles,
  Modal,
  SelectedFileIndex,
} from '../../../lib/store'
import { HDivider, VDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { Slice } from './Slice'
import { AutoSliceModal } from '../../../modals/AutoSliceModal'
import { SensitivitySlider } from './SensitivitySlider'
import { autoSlice } from '../../../actions/autoSlice'
import { DownloadFileModal } from '../../../modals/DownloadFileModal'
import { addSlice } from '../../../actions/addSlice'

export const SliceEditor = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const autoSliceMode = AutoSliceMode.useState()
  const editSliceMode = EditSliceMode.useState()
  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]

  const handleOpenAutoSliceModal = () => {
    if (selectedFile.slices.length === 0) {
      AutoSliceMode.set(true)
      autoSlice()
    } else {
      Modal.set(<AutoSliceModal />)
    }
  }

  return (
    <>
      {autoSliceMode ? (
        <>
          <Row>
            <Text $fullWidth>Auto-slice Sensitivity:</Text>
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
          <Text $fullWidth>Slices: ({selectedFile.slices.length})</Text>
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
          <Slice
            key={slice.start + '-' + slice.type + '-' + index}
            sliceIndex={index}
            forceEditSliceMode={false}
          />
        ))}
      </Slices>
      {editSliceMode && (
        <>
          <HDivider />
          <Text onClick={addSlice}>Add Slice +</Text>
        </>
      )}
    </>
  )
}

const Row = styled('div')`
  display: flex;
`

const Slices = styled('div')`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`
