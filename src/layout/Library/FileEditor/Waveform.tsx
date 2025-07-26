import styled from 'styled-components'
import { appWidth, librarySidebarWidth, waveformHeight, zoomInFactor } from '../../../lib/consts'
import { colors } from '../../../lib/colors'
import { LoadedFiles, SelectedFileIndex, SelectedSliceIndex, WindowSize } from '../../../lib/store'
import { mono } from '../../../lib/audio'

export const Waveform = () => {
  const selectedFileIndex = SelectedFileIndex.useState()
  const loadedFiles = LoadedFiles.useState()
  const selectedSliceIndex = SelectedSliceIndex.useState()
  const windowSize = WindowSize.useState()

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
  const scaleX = (width / (monoSamples.length - 1)) * factor
  const scaleY = waveformHeight / Math.pow(2, 16)

  let path = 'M'
  for (let i = 0; i < monoSamples.length; i++) {
    path += `${(i + sampleOffset) * scaleX},${monoSamples[i] * scaleY + waveformHeight / 2} `
  }

  return (
    <WaveformStyle>
      <svg width={width} height={waveformHeight}>
        <path d={path} stroke='black' fill='none' strokeWidth={1} />
        {selectedFile.slices.map((slice, index) => (
          <>
            <marker
              id={`marker-${index}`}
              viewBox='0 0 10 10'
              refX='5'
              refY='5'
              markerUnits='strokeWidth'
              markerWidth='20'
              markerHeight='20'
              orient='auto'
            >
              <path
                d='M 0 0 L 10 5 L 0 10 z'
                fill={selectedSliceIndex === index ? colors.black : colors.darkGrey}
              />
            </marker>
            <line
              key={slice.start + '-' + slice.type + '-' + index + '-line'}
              x1={(slice.start + sampleOffset) * scaleX}
              y1={0}
              x2={(slice.start + sampleOffset) * scaleX}
              y2={waveformHeight}
              stroke={selectedSliceIndex === index ? colors.black : colors.darkGrey}
              strokeWidth={1}
              markerStart={`url(#marker-${index})`}
            />
          </>
        ))}
      </svg>
    </WaveformStyle>
  )
}

const WaveformStyle = styled('div')`
  height: ${waveformHeight}px;
  background-color: ${colors.white};
`
