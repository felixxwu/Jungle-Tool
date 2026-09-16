import { playSamples, stereoSlice } from '../lib/audio'
import { resumeAudioContext } from '../lib/audioContext'
import { LoadedFiles, Playing, PreviewSource } from '../lib/store'
import { calculateDuration, stopPreview, startPreview } from '../lib/playback'

export const playTrim = async (fileIndex: number) => {
  Playing.set(false)
  const loadedFiles = LoadedFiles.ref()

  const startSlice = loadedFiles[fileIndex].slices.find(slice => slice.type === 'Start')
  const endSlice = loadedFiles[fileIndex].slices.find(slice => slice.type === 'End')
  const samples = stereoSlice(
    loadedFiles[fileIndex].samples,
    startSlice?.start ?? 0,
    endSlice?.start ?? loadedFiles[fileIndex].samples[0].length
  )

  stopPreview() // Stop and clear state before starting new playback
  await resumeAudioContext()

  const source = playSamples(samples, { loop: true })
  PreviewSource.set(source)
  source.onended = () => stopPreview()

  const durationInSeconds = calculateDuration(samples[0].length)
  startPreview(durationInSeconds)
}
