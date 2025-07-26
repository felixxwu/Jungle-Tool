import { createPlayer, stereoSlice } from '../lib/audio'
import { LoadedFiles, Player } from '../lib/store'
import { Tone } from '../lib/tone'

export const playTrim = async (fileIndex: number) => {
  const loadedFiles = LoadedFiles.ref()

  await Tone.start()
  Player.ref()?.dispose()
  const startSlice = loadedFiles[fileIndex].slices.find(slice => slice.type === 'Start')
  const endSlice = loadedFiles[fileIndex].slices.find(slice => slice.type === 'End')
  const samples = stereoSlice(
    loadedFiles[fileIndex].samples,
    startSlice?.start ?? 0,
    endSlice?.start ?? loadedFiles[fileIndex].samples[0].length
  )
  const player = await createPlayer(samples)
  player.loop = true
  Player.set(player)
  player.start()
}
