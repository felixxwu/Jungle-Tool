import { SAMPLE_RATE } from './consts'

// Constructed lazily on first use, never at module load: jsdom has no
// Web Audio, so touching AudioContext at import time would break every
// test that transitively imports this file.
let context: AudioContext | null = null

export const getAudioContext = () => {
  if (!context) context = new AudioContext({ sampleRate: SAMPLE_RATE })
  return context
}

export const resumeAudioContext = async () => {
  const ctx = getAudioContext()
  if (ctx.state !== 'running') await ctx.resume()
}

// Test-only: drop the singleton so each test starts from a clean context.
export const resetAudioContext = () => {
  context = null
}
