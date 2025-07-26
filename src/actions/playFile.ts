import { createPlayer } from '../lib/audio'
import { LoadedFiles, Player } from '../lib/store'
import { Tone } from '../lib/tone'

export const playFile = async (fileIndex: number) => {
  const loadedFiles = LoadedFiles.ref()

  await Tone.start()
  Player.ref()?.dispose()
  const player = await createPlayer(loadedFiles[fileIndex].samples)
  Player.set(player)
  player.start()
}
