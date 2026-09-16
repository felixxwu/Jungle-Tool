import { getSliceSamples } from '../helpers/getSliceSamples'
import { playSamples } from '../lib/audio'
import { resumeAudioContext } from '../lib/audioContext'
import { LoadedFiles, Playing, PreviewSource } from '../lib/store'
import { calculateDuration, stopPreview, startPreview } from '../lib/playback'

export const playSlice = async (fileIndex: number, sliceIndex: number) => {
  Playing.set(false)
  stopPreview()
  await resumeAudioContext()

  const loadedFiles = LoadedFiles.ref()
  const file = loadedFiles[fileIndex]
  const samples = getSliceSamples(file, sliceIndex)

  const source = playSamples(samples)
  PreviewSource.set(source)
  source.onended = () => stopPreview()

  const durationInSeconds = calculateDuration(samples[0].length)
  startPreview(durationInSeconds)
}
