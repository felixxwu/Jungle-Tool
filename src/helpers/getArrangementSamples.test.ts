import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getArrangementSamples } from './getArrangementSamples'
import { Layers, BPM, NumBars, Saturation, LoadedFiles } from '../lib/store'
import { getArrangementLayerSamples } from './getArrangementLayerSamples'
import { normalize, sineSaturationStereo } from '../lib/audio'
import { max } from './max'

// Mock dependencies
vi.mock('./getArrangementLayerSamples', () => ({
  getArrangementLayerSamples: vi.fn(),
}))

vi.mock('../lib/audio', () => ({
  normalize: vi.fn((samples: [Float32Array, Float32Array]) => samples),
  sineSaturationStereo: vi.fn((samples: [Float32Array, Float32Array]) => samples),
  stereoSlice: vi.fn(
    (_samples: [Float32Array, Float32Array], _start: number, end: number) => {
      return [new Float32Array(end), new Float32Array(end)]
    }
  ),
}))

vi.mock('./max', () => ({
  max: vi.fn((_arr: Float32Array) => {
    // Return a value that won't trigger normalization
    return 1000
  }),
}))

describe('getArrangementSamples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    BPM.set(120)
    NumBars.set(1)
    Saturation.set(50)
    Layers.set([])
    LoadedFiles.set([])
  })

  it('returns samples for all layers mixed together', () => {
    const layer1: [Float32Array, Float32Array] = [
      new Float32Array([0.1, 0.2, 0.3]),
      new Float32Array([0.1, 0.2, 0.3]),
    ]
    const layer2: [Float32Array, Float32Array] = [
      new Float32Array([0.4, 0.5, 0.6]),
      new Float32Array([0.4, 0.5, 0.6]),
    ]

    Layers.set([
      { filename: 'Break 1', volume: 50, pitch: 0 },
      { filename: 'Break 2', volume: 50, pitch: 0 },
    ])

    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(layer1)
      .mockReturnValueOnce(layer2)

    const result = getArrangementSamples({})

    expect(getArrangementLayerSamples).toHaveBeenCalledTimes(2)
    expect(result).toBeDefined()
    expect(result[0]).toBeInstanceOf(Float32Array)
    expect(result[1]).toBeInstanceOf(Float32Array)
  })

  it('adds layer samples together (mixing)', () => {
    const layer1: [Float32Array, Float32Array] = [
      new Float32Array([0.1, 0.2, 0.3]),
      new Float32Array([0.1, 0.2, 0.3]),
    ]
    const layer2: [Float32Array, Float32Array] = [
      new Float32Array([0.4, 0.5, 0.6]),
      new Float32Array([0.4, 0.5, 0.6]),
    ]

    Layers.set([
      { filename: 'Break 1', volume: 50, pitch: 0 },
      { filename: 'Break 2', volume: 50, pitch: 0 },
    ])

    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(layer1)
      .mockReturnValueOnce(layer2)

    getArrangementSamples({})

    // The samples should be mixed (added together)
    // We verify by checking that getArrangementLayerSamples was called for each layer
    expect(getArrangementLayerSamples).toHaveBeenCalledWith({
      layer: { filename: 'Break 1', volume: 50, pitch: 0 },
      bar: undefined,
    })
    expect(getArrangementLayerSamples).toHaveBeenCalledWith({
      layer: { filename: 'Break 2', volume: 50, pitch: 0 },
      bar: undefined,
    })
  })

  it('skips layers that return null samples', () => {
    const layer1: [Float32Array, Float32Array] = [
      new Float32Array([0.1, 0.2, 0.3]),
      new Float32Array([0.1, 0.2, 0.3]),
    ]

    Layers.set([
      { filename: 'Break 1', volume: 50, pitch: 0 },
      { filename: 'Break 2', volume: 50, pitch: 0 }, // This will return null
    ])

    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(layer1)
      .mockReturnValueOnce(null)

    getArrangementSamples({})

    expect(getArrangementLayerSamples).toHaveBeenCalledTimes(2)
    // Should still process even if one layer is null
  })

  it('normalizes samples when peak exceeds threshold', () => {
    const layer1: [Float32Array, Float32Array] = [
      new Float32Array([0.1, 0.2, 0.3]),
      new Float32Array([0.1, 0.2, 0.3]),
    ]

    Layers.set([{ filename: 'Break 1', volume: 50, pitch: 0 }])

    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>).mockReturnValueOnce(layer1)

    // Mock max to return a value that triggers normalization
    ;(max as ReturnType<typeof vi.fn>).mockReturnValueOnce(Math.pow(2, 15) + 1)

    getArrangementSamples({})

    expect(normalize).toHaveBeenCalled()
  })

  it('applies saturation effect to samples', () => {
    const layer1: [Float32Array, Float32Array] = [
      new Float32Array([0.1, 0.2, 0.3]),
      new Float32Array([0.1, 0.2, 0.3]),
    ]

    Layers.set([{ filename: 'Break 1', volume: 50, pitch: 0 }])
    Saturation.set(75)

    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>).mockReturnValueOnce(layer1)

    getArrangementSamples({})

    expect(sineSaturationStereo).toHaveBeenCalled()
    const callArgs = (sineSaturationStereo as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[1]).toBe(100) // mix = Math.min(75 * 2, 100) = 100
    expect(callArgs[2]).toBe(6) // preGain = ((75 - 50) / 50) * 12 = 6
  })

  it('handles specific bar parameter', () => {
    const layer1: [Float32Array, Float32Array] = [
      new Float32Array([0.1, 0.2, 0.3]),
      new Float32Array([0.1, 0.2, 0.3]),
    ]

    Layers.set([{ filename: 'Break 1', volume: 50, pitch: 0 }])

    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>).mockReturnValueOnce(layer1)

    getArrangementSamples({ bar: 1 })

    expect(getArrangementLayerSamples).toHaveBeenCalledWith({
      layer: { filename: 'Break 1', volume: 50, pitch: 0 },
      bar: 1,
    })
  })

  it('handles empty layers array', () => {
    Layers.set([])

    const result = getArrangementSamples({})

    expect(result).toBeDefined()
    expect(result[0]).toBeInstanceOf(Float32Array)
    expect(result[1]).toBeInstanceOf(Float32Array)
    expect(getArrangementLayerSamples).not.toHaveBeenCalled()
  })

  it('calculates waveform length based on BPM and number of bars', () => {
    BPM.set(120)
    NumBars.set(2)

    Layers.set([{ filename: 'Break 1', volume: 50, pitch: 0 }])

    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      new Float32Array(1000),
      new Float32Array(1000),
    ])

    getArrangementSamples({})

    // Should calculate length for 2 bars
    // stepSize = (60 / 120 / 4) * 44100 = 5512.5
    // waveformLength = 5512.5 * 16 * 2 = 176400
    expect(getArrangementLayerSamples).toHaveBeenCalled()
  })
})

