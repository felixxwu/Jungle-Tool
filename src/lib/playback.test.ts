import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateDuration, stopArrangement, stopPreview, startPreview } from './playback'
import { SAMPLE_RATE } from './consts'
import { PreviewSource, Playing, PlayStartTimestamp, PlayDuration } from './store'
import { stopScheduler } from './scheduler'

vi.mock('./scheduler', () => ({ stopScheduler: vi.fn().mockResolvedValue(undefined) }))

describe('calculateDuration', () => {
  it('calculates duration correctly for sample count', () => {
    const sampleCount = 44100 // 1 second at 44.1kHz
    const expected = sampleCount / SAMPLE_RATE
    expect(calculateDuration(sampleCount)).toBe(expected)
    expect(calculateDuration(sampleCount)).toBe(1)
  })

  it('handles zero samples', () => {
    expect(calculateDuration(0)).toBe(0)
  })

  it('handles large sample counts', () => {
    const sampleCount = 441000 // 10 seconds
    expect(calculateDuration(sampleCount)).toBe(10)
  })
})

describe('stopArrangement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Playing.set(false)
  })

  it('stops the scheduler and clears Playing', async () => {
    Playing.set(true)

    await stopArrangement()

    expect(stopScheduler).toHaveBeenCalledTimes(1)
    expect(Playing.ref()).toBe(false)
  })
})

describe('stopPreview', () => {
  beforeEach(() => {
    PreviewSource.set(null)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
  })

  it('stops the source, clears PreviewSource, and clears preview playback state', () => {
    const mockStop = vi.fn()
    const mockSource = { stop: mockStop }
    PreviewSource.set(mockSource as unknown as AudioBufferSourceNode)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(10)

    stopPreview()

    expect(mockStop).toHaveBeenCalledTimes(1)
    expect(PreviewSource.ref()).toBe(null)
    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
  })

  it('handles a null preview source gracefully', () => {
    PreviewSource.set(null)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(5)

    stopPreview()

    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
  })
})

describe('startPreview', () => {
  beforeEach(() => {
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
  })

  it('sets timestamp and duration', () => {
    const duration = 5.5
    startPreview(duration)

    expect(PlayStartTimestamp.ref()).not.toBe(null)
    expect(PlayDuration.ref()).toBe(duration)
  })

  it('sets timestamp to current time', () => {
    const beforeTime = Date.now()

    startPreview(10)

    const timestamp = PlayStartTimestamp.ref()
    const afterTime = Date.now()

    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })

  it('handles null duration', () => {
    startPreview(null)

    expect(PlayDuration.ref()).toBe(null)
    expect(PlayStartTimestamp.ref()).not.toBe(null)
  })

  it('handles undefined duration', () => {
    startPreview(undefined)

    expect(PlayDuration.ref()).toBe(null)
  })
})
