import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { createPlayer } from '../lib/audio'
import { Player, Playing } from '../lib/store'
import { Tone } from '../lib/tone'

export const playArrangement = async () => {
  Playing.set(true)
  await new Promise(r => setTimeout(r))
  await Tone.start()

  const samples = getArrangementSamples({})
  if (!samples) return

  const player = await createPlayer(samples)
  player.loop = true

  Player.ref()?.dispose()
  Player.set(player)
  player.start()
}
