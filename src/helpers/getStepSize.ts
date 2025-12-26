import { SAMPLE_RATE } from '../lib/consts'

/**
 * Calculates step size in samples based on BPM
 * @param bpm - Beats per minute
 * @returns Step size in samples (1/16th note at given BPM)
 */
export const getStepSize = (bpm: number): number => {
  return (60 / bpm / 4) * SAMPLE_RATE
}
