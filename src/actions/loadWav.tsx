import { WaveFile } from 'wavefile'
import { LoadedFiles, Modal, SelectedFileIndex } from '../lib/store'
import { TrimWarningModal } from '../modals/TrimWarningModal'

export const loadWav = (arrayBuffer: ArrayBuffer, fileName: string) => {
  const uint8Array = new Uint8Array(arrayBuffer)
  const wavefile = new WaveFile()
  wavefile.fromBuffer(uint8Array)
  const samples = wavefile.getSamples()
  const isStereo = samples.length === 2
  const left = isStereo ? (samples[0] as unknown as Float64Array) : samples
  const right = isStereo ? (samples[1] as unknown as Float64Array) : samples

  LoadedFiles.ref().unshift({
    name: fileName,
    artist: '',
    year: 0,
    samples: [left, right],
    slices: [
      {
        start: 0,
        type: 'Start',
        stepNum: 0,
      },
      {
        start: left.length - 1,
        type: 'End',
        stepNum: 0,
      },
    ],
  })
  LoadedFiles.set([...LoadedFiles.ref()])

  SelectedFileIndex.set(0)
  Modal.set(<TrimWarningModal />)
}
