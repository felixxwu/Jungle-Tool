import { describe, it, expect } from 'vitest'
import { createFakeAudioContext } from './audio-mock'

describe('createFakeAudioContext', () => {
  it('advances currentTime', () => {
    const ctx = createFakeAudioContext()
    expect(ctx.currentTime).toBe(0)
    ctx.advance(0.5)
    expect(ctx.currentTime).toBe(0.5)
  })

  it('records started sources with their playbackRate', () => {
    const ctx = createFakeAudioContext()
    const source = ctx.createBufferSource()
    source.playbackRate.value = 2
    source.start(1.25)
    expect(ctx.createdSources).toHaveLength(1)
    expect(ctx.createdSources[0].startedAt).toBe(1.25)
    expect(ctx.createdSources[0].playbackRate.value).toBe(2)
  })

  it('records AudioParam scheduling calls on gains', () => {
    const ctx = createFakeAudioContext()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1, 0.5)
    gain.gain.linearRampToValueAtTime(0, 0.7)
    expect(gain.gain.calls).toEqual([
      { method: 'setValueAtTime', value: 1, time: 0.5 },
      { method: 'linearRampToValueAtTime', value: 0, time: 0.7 },
    ])
  })
})
