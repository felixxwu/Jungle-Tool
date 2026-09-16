import { PreviewSource, Playing, PlayStartTimestamp, PlayDuration } from './store'
import { SAMPLE_RATE } from './consts'
import { stopScheduler } from './scheduler'

/**
 * Calculates audio duration in seconds from sample count
 */
export const calculateDuration = (sampleCount: number): number => {
  return sampleCount / SAMPLE_RATE
}

/**
 * Stops the arrangement. The Library preview is stopPreview's job.
 */
export const stopArrangement = async () => {
  await stopScheduler()
  Playing.set(false)
}

/**
 * Stops a one-shot Library preview.
 */
export const stopPreview = () => {
  PreviewSource.ref()?.stop()
  PreviewSource.set(null)
  PlayStartTimestamp.set(null)
  PlayDuration.set(null)
}

/**
 * Starts preview timing information. The source itself is already started
 * by playSamples (src/lib/audio.ts) by the time this is called.
 */
export const startPreview = (durationInSeconds?: number | null) => {
  PlayStartTimestamp.set(Date.now())
  PlayDuration.set(durationInSeconds ?? null)
}
