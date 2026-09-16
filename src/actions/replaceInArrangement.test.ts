import { describe, it, expect, beforeEach, vi } from 'vitest'
import { replaceInArrangement } from './replaceInArrangement'
import { Layers, LoadedFiles, ReplaceLayerIndex, ReplaceOriginalLayer, Tab } from '../lib/store'

vi.mock('../helpers/getBestLayerPitch', () => ({
  getBestLayerPitch: vi.fn(() => 2),
}))

vi.mock('../helpers/getBestLayerVolume', () => ({
  getBestLayerVolume: vi.fn(() => 75),
}))

describe('replaceInArrangement', () => {
  const mockFile = {
    name: 'replacement-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Layers.set([
      { filename: 'layer-a', volume: 10, pitch: -1 },
      { filename: 'layer-b', volume: 20, pitch: 3 },
    ])
    LoadedFiles.set([mockFile])
    Tab.set('library')
    ReplaceLayerIndex.set(1)
    ReplaceOriginalLayer.set({ filename: 'layer-b', volume: 20, pitch: 3 })
  })

  it('previews the candidate live in the targeted slot without confirming', () => {
    replaceInArrangement(1, 0)

    const layers = Layers.ref()
    expect(layers.length).toBe(2)
    expect(layers[0].filename).toBe('layer-a')
    expect(layers[1].filename).toBe('replacement-file')
    expect(layers[1].volume).toBe(75)
    expect(layers[1].pitch).toBe(2)

    // stays in replace mode so the candidate can still be inspected/changed
    expect(Tab.ref()).toBe('library')
    expect(ReplaceLayerIndex.ref()).toBe(1)
  })

  it('confirms and returns to the arrangement tab when the previewed candidate is clicked again', () => {
    replaceInArrangement(1, 0)
    replaceInArrangement(1, 0)

    expect(Tab.ref()).toBe('arrangement')
    expect(ReplaceLayerIndex.ref()).toBeNull()
    expect(ReplaceOriginalLayer.ref()).toBeNull()
    expect(Layers.ref()[1].filename).toBe('replacement-file')
  })

  it('does nothing for an out-of-range target index', () => {
    replaceInArrangement(5, 0)

    const layers = Layers.ref()
    expect(layers.length).toBe(2)
    expect(layers[0].filename).toBe('layer-a')
    expect(layers[1].filename).toBe('layer-b')
  })
})
