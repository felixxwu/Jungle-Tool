import styled from 'styled-components'
import {
  AutoSliceMode,
  EditSliceMode,
  Layers,
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
import { CollapsableRow } from '../../../components/CollapsableRow'
import { addToArrangement } from '../../../actions/addToArrangement'

export const SliceEditor = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const autoSliceMode = AutoSliceMode.useState()
  const editSliceMode = EditSliceMode.useState()
  const layers = Layers.useState()

  if (selectedFileIndex === null) return null

  const alreadyAdded = layers.some(layer => layer.filename === loadedFiles[selectedFileIndex].name)

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
        <CollapsableRow
          collapse={450}
          left={
            <>
              <Text onClick={addToArrangement} disabled={alreadyAdded}>
                Add to arrangement
              </Text>
              <VDivider />
            </>
          }
          right={
            <>
              <VDivider style={{ marginLeft: 'auto' }} />
              {editSliceMode ? (
                <Text onClick={handleOpenAutoSliceModal}>Auto-slice</Text>
              ) : (
                <Text onClick={() => EditSliceMode.set(true)}>Edit</Text>
              )}
              <VDivider />
              <Text onClick={() => Modal.set(<DownloadFileModal />)}>Download</Text>
            </>
          }
        />
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
