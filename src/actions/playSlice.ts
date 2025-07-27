import { getSliceSamples } from '../helpers/getSliceSamples'
import { createPlayer } from '../lib/audio'
import { LoadedFiles, Player, Playing } from '../lib/store'
import { Tone } from '../lib/tone'

export const playSlice = async (fileIndex: number, sliceIndex: number) => {
  Playing.set(false)
  const loadedFiles = LoadedFiles.ref()

  const file = loadedFiles[fileIndex]
  const samples = getSliceSamples(file, sliceIndex)

  await Tone.start()
  Player.ref()?.dispose()

  const player = await createPlayer(samples)
  Player.set(player)
  player.start()
}
