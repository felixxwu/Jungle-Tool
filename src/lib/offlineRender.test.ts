import { describe, it, expect, vi, beforeEach } from 'vitest'
import { audioBufferToSamples } from './offlineRender'
import { createFakeAudioContext } from '../test/audio-mock'

describe('audioBufferToSamples', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scales -1..1 back to 16-bit range', () => {
    const ctx = createFakeAudioContext()
    const buffer = ctx.createBuffer(2, 4, 44100)
    buffer.getChannelData(0)[0] = 1
    buffer.getChannelData(1)[0] = -1
    const [left, right] = audioBufferToSamples(buffer)
    expect(left[0]).toBeCloseTo(32767, 0)
    expect(right[0]).toBeCloseTo(-32767, 0)
  })

  it('returns both channels at full length', () => {
    const ctx = createFakeAudioContext()
    const [left, right] = audioBufferToSamples(ctx.createBuffer(2, 8, 44100))
    expect(left).toHaveLength(8)
    expect(right).toHaveLength(8)
  })
})
