import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { randomiseLayers } from './randomiseLayers'
import { Layers, LoadedFiles } from '../lib/store'
import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'

// Mock dependencies
vi.mock('../helpers/getBestLayerPitch', () => ({
  getBestLayerPitch: vi.fn((filename: string) => {
    // Return deterministic pitch based on filename
    if (filename.includes('Amen')) return 0
    if (filename.includes('Think')) return 3
    if (filename.includes('Apache')) return 5
    return 0
  }),
}))

vi.mock('../helpers/getBestLayerVolume', () => ({
  getBestLayerVolume: vi.fn((filename: string) => {
    // Return deterministic volume based on filename
    if (filename.includes('Amen')) return 50
    if (filename.includes('Think')) return 70
    if (filename.includes('Apache')) return 80
    return 50
  }),
}))

describe('randomiseLayers', () => {
  const mockFile1 = {
    name: 'Amen Brother (1)',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    artist: 'Test Artist',
    year: 1969,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockFile2 = {
    name: 'Think (About It) (1)',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    artist: 'Test Artist',
    year: 1972,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockFile3 = {
    name: 'Apache',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    artist: 'Test Artist',
    year: 1973,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockFile4 = {
    name: 'Funky Drummer',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    artist: 'Test Artist',
    year: 1970,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockFile5 = {
    name: 'PH Break',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    artist: 'Test Artist',
    year: 1970,
    whosampledLink: '',
    whosampledCount: 0,
  }

  let mathRandomSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([mockFile1, mockFile2, mockFile3, mockFile4, mockFile5])

    // Mock Math.random() to return deterministic values
    let callCount = 0
    mathRandomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      // Return values that will select different files
      const values = [0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6, 0.8]
      return values[callCount++ % values.length]
    })
  })

  afterEach(() => {
    mathRandomSpy.mockRestore()
  })

  it('maintains the same number of layers', async () => {
    Layers.set([
      { filename: 'Amen Brother (1)', volume: 50, pitch: 0 },
      { filename: 'Think (About It) (1)', volume: 70, pitch: 3 },
    ])

    await randomiseLayers()

    const layers = Layers.ref()
    expect(layers.length).toBe(2)
  })

  it('replaces layer filenames with random files', async () => {
    Layers.set([
      { filename: 'Amen Brother (1)', volume: 50, pitch: 0 },
      { filename: 'Think (About It) (1)', volume: 70, pitch: 3 },
    ])

    await randomiseLayers()

    const layers = Layers.ref()
    // Filenames should be valid filenames from LoadedFiles
    const loadedFileNames = LoadedFiles.ref().map(f => f.name)
    expect(loadedFileNames).toContain(layers[0].filename)
    expect(loadedFileNames).toContain(layers[1].filename)
    // Should not be PH Break
    expect(layers[0].filename).not.toBe('PH Break')
    expect(layers[1].filename).not.toBe('PH Break')
  })

  it('updates pitch and volume for each layer', async () => {
    Layers.set([
      { filename: 'Amen Brother (1)', volume: 50, pitch: 0 },
      { filename: 'Think (About It) (1)', volume: 70, pitch: 3 },
    ])

    await randomiseLayers()

    const layers = Layers.ref()
    // Pitch and volume should be updated based on new filenames
    expect(getBestLayerPitch).toHaveBeenCalledWith(layers[0].filename)
    expect(getBestLayerVolume).toHaveBeenCalledWith(layers[0].filename)
    expect(getBestLayerPitch).toHaveBeenCalledWith(layers[1].filename)
    expect(getBestLayerVolume).toHaveBeenCalledWith(layers[1].filename)
  })

  it('does not select duplicate base names', async () => {
    Layers.set([
      { filename: 'Amen Brother (1)', volume: 50, pitch: 0 },
      { filename: 'Think (About It) (1)', volume: 70, pitch: 3 },
    ])

    await randomiseLayers()

    const layers = Layers.ref()
    // Extract base names (before parentheses)
    const baseNames = layers.map(l => l.filename.split('(')[0].trim())
    // Should not have duplicates
    const uniqueBaseNames = new Set(baseNames)
    expect(uniqueBaseNames.size).toBe(baseNames.length)
  })

  it('excludes PH Break from selection', async () => {
    Layers.set([{ filename: 'Amen Brother (1)', volume: 50, pitch: 0 }])

    await randomiseLayers()

    const layers = Layers.ref()
    // PH Break should not be selected
    expect(layers[0].filename).not.toBe('PH Break')
  })

  it('clears and restores layers', async () => {
    Layers.set([
      { filename: 'Amen Brother (1)', volume: 50, pitch: 0 },
      { filename: 'Think (About It) (1)', volume: 70, pitch: 3 },
    ])

    await randomiseLayers()

    // Layers should be restored with randomized filenames
    expect(Layers.ref().length).toBe(2)
  })

  it('handles single layer', async () => {
    Layers.set([{ filename: 'Amen Brother (1)', volume: 50, pitch: 0 }])

    await randomiseLayers()

    const layers = Layers.ref()
    expect(layers.length).toBe(1)
    // Filename should be valid and not PH Break
    const loadedFileNames = LoadedFiles.ref().map(f => f.name)
    expect(loadedFileNames).toContain(layers[0].filename)
    expect(layers[0].filename).not.toBe('PH Break')
  })

  it('handles multiple layers with same base name variants', async () => {
    // Add multiple variants of the same break
    LoadedFiles.set([
      mockFile1,
      { ...mockFile1, name: 'Amen Brother (2)' },
      { ...mockFile1, name: 'Amen Brother (3)' },
      mockFile2,
      { ...mockFile2, name: 'Think (About It) (2)' },
    ])

    Layers.set([
      { filename: 'Amen Brother (1)', volume: 50, pitch: 0 },
      { filename: 'Think (About It) (1)', volume: 70, pitch: 3 },
    ])

    await randomiseLayers()

    const layers = Layers.ref()
    // Should not select two files with the same base name
    const baseNames = layers.map(l => l.filename.split('(')[0].trim())
    const uniqueBaseNames = new Set(baseNames)
    expect(uniqueBaseNames.size).toBe(baseNames.length)
  })
})
