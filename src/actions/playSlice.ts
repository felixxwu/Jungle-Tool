import { getSliceSamples } from '../helpers/getSliceSamples'
import { playSamples } from '../lib/audio'
import { IS_PLUGIN, playPluginPreview } from '../lib/plugin'
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

  const source = IS_PLUGIN
    ? playPluginPreview(
        file.name,
        file.slices[sliceIndex].start,
        file.slices[sliceIndex + 1]?.start ?? file.samples[0].length,
        false
      )
    : playSamples(samples)
  PreviewSource.set(source)
  source.onended = () => stopPreview()

  const durationInSeconds = calculateDuration(samples[0].length)
  startPreview(durationInSeconds)
}
