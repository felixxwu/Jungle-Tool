import {
  appWidth,
  librarySidebarWidth,
  waveformHeight,
  zoomInFactor,
  libraryPlayHead,
} from '../../../lib/consts'
import { colors } from '../../../lib/colors'
import {
  EditSliceMode,
  HoveredSliceIndex,
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
  WindowSize,
  PlayStartTimestamp,
  PlayDuration,
  Player,
} from '../../../lib/store'
import { mono } from '../../../lib/audio'
import { Waveform } from '../../../components/Waveform'
import { playFile } from '../../../actions/playFile'
import { playSlice } from '../../../actions/playSlice'
import { updateSliceStart } from '../../../actions/updateSliceStart'

export const LibraryWaveform = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const selectedSliceIndex = SelectedSliceIndex.useState()
  const windowSize = WindowSize.useState()
  const hoveredSliceIndex = HoveredSliceIndex.useState()
  const editSliceMode = EditSliceMode.useState()
  const playStartTimestamp = PlayStartTimestamp.useState()
  const playDuration = PlayDuration.useState()
  const player = Player.useState()

  if (selectedFileIndex === null) return null

  const fullWidth = appWidth - librarySidebarWidth - 1
  const width = windowSize.width < appWidth ? windowSize.width : fullWidth
  const selectedFile = loadedFiles[selectedFileIndex]
  const selectedSlice = selectedSliceIndex !== null ? selectedFile.slices[selectedSliceIndex] : null
  const monoSamples = mono(selectedFile.samples)
  const factor = selectedSliceIndex === null ? 1 : (zoomInFactor * fullWidth) / width
  const sampleOffset = (() => {
    if (selectedSliceIndex === null) return 0
    if (!selectedSlice) return 0
    const halfSamples = monoSamples.length / 2
    return halfSamples / factor - selectedSlice.start
  })()
  const trimMode = selectedFile.slices.find(slice => slice.type === 'Start' || slice.type === 'End')

  const handleClick = async (sampleIndex: number) => {
    if ((editSliceMode || trimMode) && selectedSliceIndex !== null) {
      updateSliceStart(sampleIndex, selectedSliceIndex)
      return
    }

    if (selectedSliceIndex === null) {
      playFile(selectedFileIndex)
    } else {
      playSlice(selectedFileIndex, selectedSliceIndex)
    }
  }

  return (
    <Waveform
      playHeadId={libraryPlayHead}
      samples={monoSamples}
      width={width}
      height={waveformHeight}
      offset={sampleOffset}
      scaleX={factor}
      slices={selectedFile.slices.map((slice, index) => ({
        slice,
        color:
          selectedSliceIndex === index || hoveredSliceIndex === index
            ? colors.black
            : colors.darkGrey,
      }))}
      onClick={handleClick}
      showLineOnHover={(editSliceMode || trimMode) && selectedSliceIndex !== null}
      playStartTimestamp={playStartTimestamp}
      playDuration={playDuration ? playDuration * 1000 : undefined} // Convert to milliseconds
      isPlaying={!!playStartTimestamp && player?.state !== 'stopped'}
      resetTrigger={[selectedFileIndex, selectedSliceIndex]}
    />
  )
}
