import { WaveFile } from 'wavefile'
import { LoadedFiles, Modal, SelectedFileIndex } from '../lib/store'
import { TrimWarningModal } from '../modals/TrimWarningModal'
import { normalize } from '../lib/audio'
import { SAMPLE_RATE } from '../lib/consts'
import { IS_PLUGIN } from '../lib/plugin'
import { sendUnsavedBreak } from './saveProjectBreak'

export const decodeWav = (arrayBuffer: ArrayBuffer) => {
  const uint8Array = new Uint8Array(arrayBuffer)
  const wavefile = new WaveFile()
  wavefile.fromBuffer(uint8Array)
  // Everything downstream assumes 44.1 kHz, so other rates would play at the wrong speed.
  if ((wavefile.fmt as { sampleRate: number }).sampleRate !== SAMPLE_RATE) {
    wavefile.toSampleRate(SAMPLE_RATE)
  }
  const samples = wavefile.getSamples()
  const isStereo = samples.length === 2
  const left = (isStereo ? samples[0] : samples) as unknown as Float32Array
  const right = (isStereo ? samples[1] : samples) as unknown as Float32Array
  return normalize([left, right])
}

export const loadWav = (arrayBuffer: ArrayBuffer, fileName: string) => {
  const samples = decodeWav(arrayBuffer)

  LoadedFiles.ref().unshift({
    name: fileName,
    artist: '',
    year: 0,
    samples,
    slices: [
      {
        start: 0,
        type: 'Start',
        stepNum: 0,
      },
      {
        start: samples[0].length - 1,
        type: 'End',
        stepNum: 0,
      },
    ],
    whosampledLink: '',
    whosampledCount: 0,
  })
  LoadedFiles.set([...LoadedFiles.ref()])

  if (IS_PLUGIN) sendUnsavedBreak(LoadedFiles.ref()[0])
  SelectedFileIndex.set(0)
  Modal.set(<TrimWarningModal />)
}
