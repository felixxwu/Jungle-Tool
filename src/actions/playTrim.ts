import { createPlayer, stereoSlice } from '../lib/audio'
import { LoadedFiles, Player, Playing } from '../lib/store'
import {
  setupPlayback,
  stopPlayback,
  setupPlayerStopHandler,
  startPlayback,
  calculateDuration,
} from '../lib/playback'

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

  stopPlayback() // Stop and clear state before starting new playback
  await setupPlayback()

  const player = await createPlayer(samples)
  player.loop = true
  Player.set(player)

  setupPlayerStopHandler(player)
  const durationInSeconds = calculateDuration(samples[0].length)
  startPlayback(player, durationInSeconds)
}
