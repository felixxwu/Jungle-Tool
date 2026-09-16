import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playArrangement } from './playArrangement'
import { Playing } from '../lib/store'
import { startScheduler } from '../lib/scheduler'
import { resumeAudioContext } from '../lib/audioContext'

vi.mock('../lib/scheduler', () => ({ startScheduler: vi.fn() }))
vi.mock('../lib/audioContext', () => ({ resumeAudioContext: vi.fn().mockResolvedValue(undefined) }))

describe('playArrangement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Playing.set(false)
  })

  it('resumes the audio context before starting', async () => {
    await playArrangement()
    expect(resumeAudioContext).toHaveBeenCalled()
  })

  it('starts the scheduler', async () => {
    await playArrangement()
    expect(startScheduler).toHaveBeenCalled()
  })

  it('marks the arrangement as playing', async () => {
    await playArrangement()
    expect(Playing.ref()).toBe(true)
  })
})
