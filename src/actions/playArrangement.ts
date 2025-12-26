import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { createPlayer } from '../lib/audio'
import { Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
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

  // Clear states when playback stops
  player.onstop = () => {
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    Playing.set(false)
  }

  player.start()
  PlayStartTimestamp.set(Date.now())
  PlayDuration.set(null) // Arrangement calculates duration dynamically from BPM
}
