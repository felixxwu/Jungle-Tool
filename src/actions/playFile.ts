import { playSamples } from '../lib/audio'
import { resumeAudioContext } from '../lib/audioContext'
import { LoadedFiles, Playing, PreviewSource } from '../lib/store'
import { calculateDuration, stopPreview, startPreview } from '../lib/playback'

export const playFile = async (fileIndex: number) => {
  Playing.set(false)
  stopPreview()
  await resumeAudioContext()

  const loadedFiles = LoadedFiles.ref()
  const file = loadedFiles[fileIndex]

  const source = playSamples(file.samples)
  PreviewSource.set(source)
  source.onended = () => stopPreview()

  const durationInSeconds = calculateDuration(file.samples[0].length)
  startPreview(durationInSeconds)
}
