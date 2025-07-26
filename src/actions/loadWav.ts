import { WaveFile } from 'wavefile'
import { LoadedFiles } from '../lib/store'

export const loadWav = (arrayBuffer: ArrayBuffer, fileName: string) => {
  const uint8Array = new Uint8Array(arrayBuffer)
  const wavefile = new WaveFile()
  wavefile.fromBuffer(uint8Array)
  const samples = wavefile.getSamples()
  const left = samples[0] as unknown as Float64Array
  const right = samples[1] as unknown as Float64Array

  LoadedFiles.ref().push({
    path: '',
    name: fileName,
    artist: '',
    year: 0,
    samples: [left, right],
    slices: [],
  })
  LoadedFiles.set([...LoadedFiles.ref()])
}
