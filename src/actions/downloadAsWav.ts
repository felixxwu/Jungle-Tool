import { WaveFile } from 'wavefile'
import { SAMPLE_RATE } from '../lib/consts'

export const downloadAsWav = (samples: [Float32Array, Float32Array], filename: string) => {
  const wavefile = new WaveFile()
  wavefile.fromScratch(2, SAMPLE_RATE, '16', samples)

  const wavBuffer = wavefile.toBuffer()
  const blob = new Blob([wavBuffer as BlobPart], { type: 'audio/wav' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace('.', '')
  document.body.appendChild(a)
  a.click()

  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
