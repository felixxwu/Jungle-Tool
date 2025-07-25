import styled from 'styled-components'
import { HDivider, VDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import type { SliceType } from '../../../lib/types'
import { useState } from 'react'
import { LoadedFiles, SelectedFileIndex, SelectedSliceIndex } from '../../../lib/store'
import { largeSliceAdjustment, smallSliceAdjustment } from '../../../lib/consts'

export const Slice = (p: { sliceIndex: number }) => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const selectedSliceIndex = SelectedSliceIndex.useState()

  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]
  const slice = selectedFile.slices[p.sliceIndex]
  const [editMode, setEditMode] = useState(false)

  const handleSelectSlice = () => {
    if (selectedSliceIndex === p.sliceIndex) {
      SelectedSliceIndex.set(null)
    } else {
      SelectedSliceIndex.set(p.sliceIndex)
    }
  }

  const handleSetSliceType = (type: SliceType) => {
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices[p.sliceIndex].type = type
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
  }

  const handleUpdateSliceStart = (start: number) => {
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices[p.sliceIndex].start += start
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
  }

  const handleDeleteSlice = () => {
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices.splice(p.sliceIndex, 1)
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
    SelectedSliceIndex.set(null)
  }

  if (editMode) {
    return (
      <>
        <SliceStyle>
          <Text>Change {slice.type} to:</Text>
          <VDivider />
          <Text onClick={() => handleSetSliceType('Kick')}>Kick</Text>
          <VDivider />
          <Text onClick={() => handleSetSliceType('Snare')}>Snare</Text>
          <VDivider />
          <Text onClick={() => handleSetSliceType('Hat')}>Hat</Text>
          <VDivider />
          <VDivider style={{ marginLeft: 'auto' }} />
          <Text onClick={handleDeleteSlice}>Delete</Text>
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
        <VDivider />
        <Text onClick={() => setEditMode(true)}>Edit</Text>
        <VDivider />
        <Text
          onClick={() => handleUpdateSliceStart(-largeSliceAdjustment)}
          disabled={slice.start < largeSliceAdjustment}
        >
          «
        </Text>
        <VDivider />
        <Text
          onClick={() => handleUpdateSliceStart(-smallSliceAdjustment)}
          disabled={slice.start < smallSliceAdjustment}
        >
          ‹
        </Text>
        <VDivider />
        <Text onClick={() => handleUpdateSliceStart(smallSliceAdjustment)}>›</Text>
        <VDivider />
        <Text onClick={() => handleUpdateSliceStart(largeSliceAdjustment)}>»</Text>
      </SliceStyle>
      <HDivider />
    </>
  )
}

const SliceStyle = styled('div')`
  display: flex;
`
