import { createPlayer } from '../lib/audio'
import { LoadedFiles, Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { Tone } from '../lib/tone'

export const playFile = async (fileIndex: number) => {
  Playing.set(false)
  const loadedFiles = LoadedFiles.ref()
  const file = loadedFiles[fileIndex]

  await Tone.start()
  Player.ref()?.dispose()
  const player = await createPlayer(file.samples)
  Player.set(player)

  // Set playback timing info
  const durationInSeconds = file.samples[0].length / 44100 // Assuming 44.1kHz sample rate
  PlayStartTimestamp.set(Date.now())
  PlayDuration.set(durationInSeconds)

  // Clear timestamps when playback stops
  player.onstop = () => {
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
  }

  player.start()
}
