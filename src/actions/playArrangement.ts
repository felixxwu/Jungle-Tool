import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { createPlayer } from '../lib/audio'
import { Arrangement, BPM, Layers, LoadedFiles, Player, Playing } from '../lib/store'
import { Tone } from '../lib/tone'

export const playArrangement = async () => {
  await Tone.start()
  Player.ref()?.dispose()

  const samples = getArrangementSamples({
    arrangement: Arrangement.ref(),
    loadedFiles: LoadedFiles.ref(),
    bpm: BPM.ref(),
    layers: Layers.ref(),
  })
  if (!samples) return

  const player = await createPlayer(samples)
  player.loop = true
  Player.set(player)
  player.start()

  Playing.set(true)
}
