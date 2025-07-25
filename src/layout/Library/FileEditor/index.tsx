import { mono } from '../../../lib/audio'
import { SelectedFile } from '../../../lib/store'

export const FileEditor = () => {
  const selectedFile = SelectedFile.useState()
  const monoSamples = mono(selectedFile?.samples)
  const width = 550
  const height = 200
  const scaleX = width / (monoSamples.length - 1)
  const scaleY = height / Math.pow(2, 16)

  let path = 'M'
  for (let i = 0; i < monoSamples.length; i++) {
    path += `${i * scaleX},${monoSamples[i] * scaleY + height / 2} `
  }

  return (
    <svg width={width} height={height}>
      <path d={path} stroke='black' fill='none' strokeWidth={1} />
    </svg>
  )
}
