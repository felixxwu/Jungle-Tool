import { describe, it, expect, beforeEach, vi } from 'vitest'
import { addToArrangement } from './addToArrangement'
import { Layers, LoadedFiles, Tab } from '../lib/store'
import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'

// Mock helpers
vi.mock('../helpers/getBestLayerPitch', () => ({
  getBestLayerPitch: vi.fn(() => 2),
}))

vi.mock('../helpers/getBestLayerVolume', () => ({
  getBestLayerVolume: vi.fn(() => 75),
}))

describe('addToArrangement', () => {
  const mockFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Layers.set([])
    Tab.set('library')
    LoadedFiles.set([mockFile])
  })

  it('switches to arrangement tab', () => {
    Tab.set('library')
    addToArrangement(0)
    expect(Tab.ref()).toBe('arrangement')
  })

  it('adds file to layers with calculated pitch and volume', () => {
    addToArrangement(0)

    const layers = Layers.ref()
    expect(layers.length).toBe(1)
    expect(layers[0].filename).toBe('test-file')
    expect(layers[0].pitch).toBe(2)
    expect(layers[0].volume).toBe(75)
    expect(getBestLayerPitch).toHaveBeenCalledWith('test-file')
    expect(getBestLayerVolume).toHaveBeenCalledWith('test-file')
  })

  it('appends to existing layers', () => {
    Layers.set([
      { filename: 'existing-file', volume: 50, pitch: 0 },
    ])

    addToArrangement(0)

    const layers = Layers.ref()
    expect(layers.length).toBe(2)
    expect(layers[0].filename).toBe('existing-file')
    expect(layers[1].filename).toBe('test-file')
  })

  it('uses calculated values from helpers', () => {
    ;(getBestLayerPitch as ReturnType<typeof vi.fn>).mockReturnValue(5)
    ;(getBestLayerVolume as ReturnType<typeof vi.fn>).mockReturnValue(90)

    addToArrangement(0)

    const layers = Layers.ref()
    expect(layers[0].pitch).toBe(5)
    expect(layers[0].volume).toBe(90)
  })
})

