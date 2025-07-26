import styled from 'styled-components'
import { HDivider, VDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import type { SliceType } from '../../../lib/types'
import { useState } from 'react'
import {
  EditSliceMode,
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
  WindowSize,
} from '../../../lib/store'
import { largeSliceAdjustment, smallSliceAdjustment } from '../../../lib/consts'
import { playSlice } from '../../../actions/playSlice'

export const Slice = (p: { sliceIndex: number }) => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const selectedSliceIndex = SelectedSliceIndex.useState()
  const windowSize = WindowSize.useState()
  const editSliceMode = EditSliceMode.useState()

  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]
  const slice = selectedFile.slices[p.sliceIndex]
  const [editMode, setEditMode] = useState(false)

  const handleSelectSlice = async () => {
    if (selectedSliceIndex === p.sliceIndex) {
      SelectedSliceIndex.set(null)
    } else {
      SelectedSliceIndex.set(p.sliceIndex)
    }
    await playSlice(selectedFileIndex, p.sliceIndex)
  }

  const handleSetSliceType = (type: SliceType) => {
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices[p.sliceIndex].type = type
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
  }

  const handleUpdateSliceStart = async (start: number) => {
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices[p.sliceIndex].start += start
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
    await playSlice(selectedFileIndex, p.sliceIndex)
  }

  const handleDeleteSlice = () => {
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices.splice(p.sliceIndex, 1)
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
    SelectedSliceIndex.set(null)
  }

  const Selection = () => {
    return (
      <>
        <Text onClick={() => handleSetSliceType('Kick')}>Kick</Text>
        <VDivider />
        <Text onClick={() => handleSetSliceType('Snare')}>Snare</Text>
        <VDivider />
        <Text onClick={() => handleSetSliceType('Hat')}>Hat</Text>
        <VDivider />
        <Text onClick={() => handleSetSliceType('End')}>End</Text>
        <VDivider />
        <VDivider style={{ marginLeft: 'auto' }} />
        <Text onClick={handleDeleteSlice}>Delete</Text>
      </>
    )
  }

  if (editMode && windowSize.width < 600) {
    return (
      <>
        <SliceStyle>
          <Text>Change {slice.type} to:</Text>
          <VDivider />
        </SliceStyle>
        <HDivider />
        <SliceStyle>
          <Selection />
        </SliceStyle>
        <HDivider />
      </>
    )
  }

  if (editMode) {
    return (
      <>
        <SliceStyle>
          <Text>Change {slice.type} to:</Text>
          <VDivider />
          <Selection />
        </SliceStyle>
        <HDivider />
      </>
    )
  }

  return (
    <>
      <SliceStyle>
        <Text $fullWidth selected={selectedSliceIndex === p.sliceIndex} onClick={handleSelectSlice}>
          {slice.type}
        </Text>
        {editSliceMode && (
          <>
            <VDivider />
            <Text onClick={() => setEditMode(true)}>Edit</Text>
            <VDivider />
            <Text
              onClick={() => handleUpdateSliceStart(-largeSliceAdjustment)}
              disabled={slice.start < largeSliceAdjustment}
            >
              «
            </Text>
            <Text
              onClick={() => handleUpdateSliceStart(-smallSliceAdjustment)}
              disabled={slice.start < smallSliceAdjustment}
            >
              ‹
            </Text>
            <Text onClick={() => handleUpdateSliceStart(smallSliceAdjustment)}>›</Text>
            <Text onClick={() => handleUpdateSliceStart(largeSliceAdjustment)}>»</Text>
          </>
        )}
      </SliceStyle>
      <HDivider />
    </>
  )
}

const SliceStyle = styled('div')`
  display: flex;
`
