import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { createPlayer } from '../lib/audio'
import { Arrangement, BPM, Layers, LoadedFiles, Player, Playing, Swing } from '../lib/store'
import { Tone } from '../lib/tone'

export const playArrangement = async () => {
  Playing.set(true)
  await new Promise(r => setTimeout(r))
  await Tone.start()

  const samples = getArrangementSamples({
    arrangement: Arrangement.ref(),
    loadedFiles: LoadedFiles.ref(),
    bpm: BPM.ref(),
    swing: Swing.ref(),
    layers: Layers.ref(),
  })
  if (!samples) return

  const player = await createPlayer(samples)
  player.loop = true

  Player.ref()?.dispose()
  Player.set(player)
  player.start()
}
