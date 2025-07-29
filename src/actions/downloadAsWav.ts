import { WaveFile } from 'wavefile'

export const downloadAsWav = (samples: [Float64Array, Float64Array], filename: string) => {
  const wavefile = new WaveFile()
  wavefile.fromScratch(2, 44100, '16', samples)

  const wavBuffer = wavefile.toBuffer()
  const blob = new Blob([wavBuffer], { type: 'audio/wav' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace('.', '')
  document.body.appendChild(a)
  a.click()

  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
