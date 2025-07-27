import { createPlayer } from '../lib/audio'
import { LoadedFiles, Player, Playing } from '../lib/store'
import { Tone } from '../lib/tone'

export const playFile = async (fileIndex: number) => {
  Playing.set(false)
  const loadedFiles = LoadedFiles.ref()

  await Tone.start()
  Player.ref()?.dispose()
  const player = await createPlayer(loadedFiles[fileIndex].samples)
  Player.set(player)
  player.start()
}
