import { createPlayer } from '../lib/audio'
import { LoadedFiles, Player } from '../lib/store'
import { Tone } from '../lib/tone'

export const playSlice = async (fileIndex: number, sliceIndex: number) => {
  const loadedFiles = LoadedFiles.ref()

  const file = loadedFiles[fileIndex]
  const slice = file.slices[sliceIndex]
  const nextSlice = file.slices[sliceIndex + 1]
  const sliceStart = slice.start
  const sliceEnd = nextSlice ? nextSlice.start : file.samples[0].length

  await Tone.start()
  Player.ref()?.dispose()

  const player = await createPlayer([
    file.samples[0].slice(sliceStart, sliceEnd),
    file.samples[1].slice(sliceStart, sliceEnd),
  ])
  Player.set(player)
  player.start()
}
