import { WaveFile } from 'wavefile'
import { LoadedFiles, Modal, SelectedFileIndex } from '../lib/store'
import { TrimWarningModal } from '../modals/TrimWarningModal'

export const loadWav = (arrayBuffer: ArrayBuffer, fileName: string) => {
  const uint8Array = new Uint8Array(arrayBuffer)
  const wavefile = new WaveFile()
  wavefile.fromBuffer(uint8Array)
  const samples = wavefile.getSamples()
  const left = samples[0] as unknown as Float64Array
  const right = samples[1] as unknown as Float64Array

  LoadedFiles.ref().unshift({
    name: fileName,
    artist: '',
    year: 0,
    samples: [left, right],
    slices: [
      {
        start: 0,
        type: 'Start',
      },
      {
        start: left.length - 1,
        type: 'End',
      },
    ],
  })
  LoadedFiles.set([...LoadedFiles.ref()])

  SelectedFileIndex.set(0)
  Modal.set(<TrimWarningModal />)
}
