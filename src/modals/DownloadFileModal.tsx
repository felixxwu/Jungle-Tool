import styled from 'styled-components'
import { Text } from '../components/Text'
import { LoadedFiles, Modal, SelectedFileIndex } from '../lib/store'
import { WaveFile } from 'wavefile'

export const DownloadFileModal = () => {
  const loadedFiles = LoadedFiles.useState()
  const selectedFileIndex = SelectedFileIndex.useState()

  if (selectedFileIndex === null) return null

  const selectedFile = loadedFiles[selectedFileIndex]

  const handleDownloadWavFile = () => {
    const wavefile = new WaveFile()
    wavefile.fromScratch(2, 44100, '16', selectedFile.samples)
    const buffer = wavefile.toBuffer()
    const blob = new Blob([buffer], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedFile.name}.wav`
    a.click()
    a.remove()

    Modal.set(null)
  }

  const handleDownloadCustomFile = () => {
    const wavefile = new WaveFile()
    wavefile.fromScratch(2, 44100, '16', selectedFile.samples)
    const base64 = wavefile.toBase64()
    const jsonToDownload = {
      name: selectedFile.name,
      artist: selectedFile.artist,
      year: selectedFile.year,
      slices: selectedFile.slices,
      base64,
    }
    const blob = new Blob([JSON.stringify(jsonToDownload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedFile.name}.json`
    a.click()
    a.remove()

    Modal.set(null)
  }
  return (
    <ModalContent>
      <div>
        If you would like to save the slices, you can download a custom file that can only be opened
        with Jungle Tool.
      </div>
      <Text onClick={handleDownloadWavFile}>Download wav file</Text>
      <Text onClick={handleDownloadCustomFile}>Download custom file with slices</Text>
      <Text onClick={() => Modal.set(null)}>Cancel</Text>
    </ModalContent>
  )
}

const ModalContent = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`
