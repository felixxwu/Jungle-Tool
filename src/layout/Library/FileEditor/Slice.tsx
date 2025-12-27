import styled from 'styled-components'
import { HDivider, VDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import type { SliceType } from '../../../lib/types'
import { useState } from 'react'
import {
  EditSliceMode,
  HoveredSliceIndex,
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
  WindowSize,
} from '../../../lib/store'
import { largeSliceAdjustment, smallSliceAdjustment } from '../../../lib/consts'
import { playSlice } from '../../../actions/playSlice'
import { playTrim } from '../../../actions/playTrim'
import { updateSliceStart } from '../../../actions/updateSliceStart'

export const Slice = (p: { sliceIndex: number; forceEditSliceMode?: boolean }) => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const selectedSliceIndex = SelectedSliceIndex.useState()
  const windowSize = WindowSize.useState()
  const editSliceMode = EditSliceMode.useState() || p.forceEditSliceMode

  const [editMode, setEditMode] = useState(false)
  const [stepEditMode, setStepEditMode] = useState(false)

  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]
  const slice = selectedFile.slices[p.sliceIndex]
  const isTrimmer = slice.type === 'Start' || slice.type === 'End'

  const handleSelectSlice = async () => {
    if (selectedSliceIndex === p.sliceIndex) {
      SelectedSliceIndex.set(null)
    } else {
      SelectedSliceIndex.set(p.sliceIndex)
    }

    if (isTrimmer) {
      await playTrim(selectedFileIndex)
    } else {
      await playSlice(selectedFileIndex, p.sliceIndex)
    }
  }

  const handleSetSliceType = (type: SliceType) => {
    const newLoadedFiles = [...loadedFiles]
    const newSlices = [...newLoadedFiles[selectedFileIndex].slices]
    newSlices[p.sliceIndex] = { ...newSlices[p.sliceIndex], type }
    newLoadedFiles[selectedFileIndex] = {
      ...newLoadedFiles[selectedFileIndex],
      slices: newSlices,
    }
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
  }

  const handleUpdateSliceStart = async (start: number) => {
    updateSliceStart(slice.start + start, p.sliceIndex, start < 0 ? 'backward' : 'forward')
    setEditMode(false)
  }

  const handleDeleteSlice = () => {
    const newLoadedFiles = [...loadedFiles]
    newLoadedFiles[selectedFileIndex].slices.splice(p.sliceIndex, 1)
    LoadedFiles.set(newLoadedFiles)
    setEditMode(false)
    SelectedSliceIndex.set(null)
  }

  const handleUpdateSliceStepNum = (stepNum: number) => {
    if (stepNum < 0) return
    if (stepNum > 15) return
    const newLoadedFiles = [...loadedFiles]
    const newSlices = [...newLoadedFiles[selectedFileIndex].slices]
    newSlices[p.sliceIndex] = { ...newSlices[p.sliceIndex], stepNum }
    newLoadedFiles[selectedFileIndex] = {
      ...newLoadedFiles[selectedFileIndex],
      slices: newSlices,
    }
    LoadedFiles.set(newLoadedFiles)
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

  const stemNum = slice.stepNum ?? 0

  return (
    <>
      <SliceStyle>
        {stepEditMode && (
          <Text disabled={stemNum === 0} onClick={() => handleUpdateSliceStepNum(stemNum - 1)}>
            ‹
          </Text>
        )}
        <Text
          disabled={!editSliceMode}
          onClick={() => setStepEditMode(!stepEditMode)}
          style={{ minWidth: '45px', maxWidth: '45px', textAlign: 'center' }}
        >
          {stemNum < 10 ? '0' : ''}
          {stemNum}
        </Text>
        {stepEditMode && (
          <Text disabled={stemNum === 15} onClick={() => handleUpdateSliceStepNum(stemNum + 1)}>
            ›
          </Text>
        )}
        <VDivider />
        <Text
          fullWidth
          selected={selectedSliceIndex === p.sliceIndex}
          onClick={handleSelectSlice}
          onPointerEnter={() => HoveredSliceIndex.set(p.sliceIndex)}
        >
          {slice.type}
        </Text>
        {editSliceMode && !stepEditMode && (
          <>
            {!isTrimmer && (
              <>
                <VDivider />
                <Text onClick={() => setEditMode(true)}>Edit</Text>
              </>
            )}
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
