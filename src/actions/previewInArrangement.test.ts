import { describe, it, expect, beforeEach, vi } from 'vitest'
import { previewInArrangement } from './previewInArrangement'
import { Layers, LoadedFiles } from '../lib/store'

vi.mock('../helpers/getBestLayerPitch', () => ({
  getBestLayerPitch: vi.fn(() => 2),
}))

vi.mock('../helpers/getBestLayerVolume', () => ({
  getBestLayerVolume: vi.fn(() => 75),
}))

describe('previewInArrangement', () => {
  const mockFile1 = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockFile2 = { ...mockFile1, name: 'other-file' }

  beforeEach(() => {
    vi.clearAllMocks()
    Layers.set([])
    LoadedFiles.set([mockFile1, mockFile2])
  })

  it('hot-adds the file as a temp layer', () => {
    previewInArrangement(0)

    const layers = Layers.ref()
    expect(layers.length).toBe(1)
    expect(layers[0].filename).toBe('test-file')
    expect(layers[0].temp).toBe(true)
    expect(layers[0].pitch).toBe(2)
    expect(layers[0].volume).toBe(75)
  })

  it('keeps existing permanent layers', () => {
    Layers.set([{ filename: 'existing', volume: 50, pitch: 0 }])

    previewInArrangement(0)

    const layers = Layers.ref()
    expect(layers.length).toBe(2)
    expect(layers.find(l => l.filename === 'existing')).toBeTruthy()
  })

  it('replaces a previous temp layer when previewing a different file', () => {
    previewInArrangement(0)
    previewInArrangement(1)

    const layers = Layers.ref()
    expect(layers.filter(l => l.temp).length).toBe(1)
    expect(layers.find(l => l.temp)?.filename).toBe('other-file')
  })

  it('does not duplicate a layer that is already permanently added', () => {
    Layers.set([{ filename: 'test-file', volume: 60, pitch: 1 }])

    previewInArrangement(0)

    const layers = Layers.ref()
    expect(layers.length).toBe(1)
    expect(layers[0].temp).toBeFalsy()
  })
})
