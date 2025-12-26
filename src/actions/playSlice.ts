import { getSliceSamples } from '../helpers/getSliceSamples'
import { createPlayer } from '../lib/audio'
import { LoadedFiles, Player, Playing } from '../lib/store'
import {
  setupPlayback,
  setupPlayerStopHandler,
  startPlayback,
  calculateDuration,
} from '../lib/playback'

export const playSlice = async (fileIndex: number, sliceIndex: number) => {
  Playing.set(false)
  const loadedFiles = LoadedFiles.ref()

  const file = loadedFiles[fileIndex]
  const samples = getSliceSamples(file, sliceIndex)

  await setupPlayback()
  const player = await createPlayer(samples)
  Player.set(player)

  setupPlayerStopHandler(player)
  const durationInSeconds = calculateDuration(samples[0].length)
  startPlayback(player, durationInSeconds)
}
