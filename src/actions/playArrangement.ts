import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { createPlayer } from '../lib/audio'
import { Player, Playing } from '../lib/store'
import { setupPlayback, setupPlayerStopHandler, startPlayback } from '../lib/playback'

export const playArrangement = async () => {
  Playing.set(true)
  await setupPlayback()

  const samples = getArrangementSamples({})
  if (!samples) return

  const player = await createPlayer(samples)
  player.loop = true

  Player.set(player)
  setupPlayerStopHandler(player, { clearPlaying: true })
  startPlayback(player, null) // Arrangement calculates duration dynamically from BPM
}
