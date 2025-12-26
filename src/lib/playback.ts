import { Player, Playing, PlayStartTimestamp, PlayDuration } from './store'
import { Tone } from './tone'
import { SAMPLE_RATE } from './consts'
import type { Tone as ToneType } from './tone'

/**
 * Calculates audio duration in seconds from sample count
 */
export const calculateDuration = (sampleCount: number): number => {
  return sampleCount / SAMPLE_RATE
}

/**
 * Stops current playback and clears all playback state
 */
export const stopPlayback = () => {
  Player.ref()?.stop()
  Playing.set(false)
  PlayStartTimestamp.set(null)
  PlayDuration.set(null)
}

/**
 * Disposes of the current player
 */
export const disposePlayer = () => {
  Player.ref()?.dispose()
}

/**
 * Sets up player stop handler to clear playback state
 */
export const setupPlayerStopHandler = (
  player: ToneType.Player,
  options?: { clearPlaying?: boolean }
) => {
  const clearPlaying = options?.clearPlaying ?? false
  player.onstop = () => {
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    if (clearPlaying) {
      Playing.set(false)
    }
  }
}

/**
 * Common playback setup: starts Tone, disposes old player, creates new player
 */
export const setupPlayback = async (): Promise<void> => {
  await Tone.start()
  disposePlayer()
}

/**
 * Starts playback with timing information
 */
export const startPlayback = (player: ToneType.Player, durationInSeconds?: number | null) => {
  player.start()
  PlayStartTimestamp.set(Date.now())
  PlayDuration.set(durationInSeconds ?? null)
}
