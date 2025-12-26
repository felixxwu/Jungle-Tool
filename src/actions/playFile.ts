import { createPlayer } from '../lib/audio'
import { LoadedFiles, Player, Playing } from '../lib/store'
import {
  setupPlayback,
  setupPlayerStopHandler,
  startPlayback,
  calculateDuration,
} from '../lib/playback'

export const playFile = async (fileIndex: number) => {
  Playing.set(false)
  const loadedFiles = LoadedFiles.ref()
  const file = loadedFiles[fileIndex]

  await setupPlayback()
  const player = await createPlayer(file.samples)
  Player.set(player)

  setupPlayerStopHandler(player)
  const durationInSeconds = calculateDuration(file.samples[0].length)
  startPlayback(player, durationInSeconds)
}
