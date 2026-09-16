import { describe, it, expect, beforeEach } from 'vitest'
import { getAudioContext, resumeAudioContext, resetAudioContext } from './audioContext'
import { SAMPLE_RATE } from './consts'

describe('audioContext', () => {
  beforeEach(() => resetAudioContext())

  it('returns the same instance on repeated calls', () => {
    expect(getAudioContext()).toBe(getAudioContext())
  })

  it('creates the context at the project sample rate', () => {
    expect(getAudioContext().sampleRate).toBe(SAMPLE_RATE)
  })

  it('resumes without throwing', async () => {
    await expect(resumeAudioContext()).resolves.toBeUndefined()
  })
})
