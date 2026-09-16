import { describe, it, expect } from 'vitest'
import { buildGraph } from './graph'
import { createFakeAudioContext } from '../test/audio-mock'
import { masterTrim } from './consts'

describe('buildGraph', () => {
  it('sets the trim gain to the configured headroom', () => {
    const ctx = createFakeAudioContext()
    buildGraph(ctx as unknown as BaseAudioContext)
    expect(ctx.createdGains[0].gain.value).toBeCloseTo(masterTrim, 6)
  })

  it('returns the same gain node for a repeated filename', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    expect(graph.layerGain('Amen#0')).toBe(graph.layerGain('Amen#0'))
  })

  it('creates separate gain nodes per layer filename', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    expect(graph.layerGain('Amen#0')).not.toBe(graph.layerGain('Think#1'))
  })

  it('keeps two layers of the same break independent', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    expect(graph.layerGain('Amen#0')).not.toBe(graph.layerGain('Amen#1'))
  })

  it('ramps layer volume rather than assigning it', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    graph.setLayerVolume('Amen#0', 50)
    const gain = graph.layerGain('Amen#0') as unknown as { gain: { calls: unknown[]; value: number } }
    expect(gain.gain.calls).toHaveLength(1)
    expect(gain.gain.value).toBeCloseTo(0.5, 6)
  })

  it('drops gain nodes for layers that no longer exist', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    const first = graph.layerGain('Amen#0')
    graph.pruneLayers(['Think#0'])
    expect(graph.layerGain('Amen#0')).not.toBe(first)
  })

  it('does not rebuild the saturation curve when the value is unchanged', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    graph.setSaturation(50)
    const firstCurve = ctx.createdShapers[0].curve
    graph.setSaturation(50)
    expect(ctx.createdShapers[0].curve).toBe(firstCurve)

    graph.setSaturation(75)
    expect(ctx.createdShapers[0].curve).not.toBe(firstCurve)
  })

  it('cancels and restarts the trim ramp rather than stacking automation', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    graph.rampTrimTo(0.1, 0.02)
    const calls = ctx.createdGains[0].gain.calls
    expect(calls.map(call => call.method)).toEqual([
      'cancelScheduledValues',
      'setValueAtTime',
      'linearRampToValueAtTime',
    ])
    expect(calls[2].value).toBeCloseTo(0.1, 6)
  })
})
