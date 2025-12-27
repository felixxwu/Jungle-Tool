import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadJson } from './loadJson'
import { LoadedFiles, SelectedFileIndex } from '../lib/store'

// Mock WaveFile
vi.mock('wavefile', () => ({
  WaveFile: vi.fn().mockImplementation(() => ({
    fromBase64: vi.fn(),
    getSamples: vi.fn(() => [new Float32Array([0.1, 0.2, 0.3]), new Float32Array([0.4, 0.5, 0.6])]),
  })),
}))

// Mock normalize
vi.mock('../lib/audio', () => ({
  normalize: vi.fn((samples: [Float32Array, Float32Array]) => samples),
}))

describe('loadJson', () => {
  beforeEach(() => {
    LoadedFiles.set([])
    SelectedFileIndex.set(null)
  })

  it('loads break sample from JSON with all metadata', () => {
    const jsonString = JSON.stringify({
      name: 'Amen Brother (1)',
      artist: 'The Winstons',
      year: 1969,
      base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      slices: [
        { start: 0, type: 'Kick', stepNum: 0 },
        { start: 1000, type: 'Snare', stepNum: 4 },
      ],
      whosampledLink: 'https://www.whosampled.com/sample/123/',
      whosampledCount: 5000,
    })

    loadJson(jsonString)

    const loadedFiles = LoadedFiles.ref()
    expect(loadedFiles.length).toBe(1)

    const file = loadedFiles[0]
    expect(file.name).toBe('Amen Brother (1)')
    expect(file.artist).toBe('The Winstons')
    expect(file.year).toBe(1969)
    expect(file.slices).toEqual([
      { start: 0, type: 'Kick', stepNum: 0 },
      { start: 1000, type: 'Snare', stepNum: 4 },
    ])
    expect(file.whosampledLink).toBe('https://www.whosampled.com/sample/123/')
    expect(file.whosampledCount).toBe(5000)
    expect(file.samples).toBeDefined()
    expect(file.samples.length).toBe(2) // Stereo samples
  })

  it('parses audio samples from base64', () => {
    const jsonString = JSON.stringify({
      name: 'Test Break',
      artist: 'Test Artist',
      year: 2020,
      base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      slices: [],
      whosampledLink: '',
      whosampledCount: 0,
    })

    loadJson(jsonString)

    const file = LoadedFiles.ref()[0]
    expect(file.samples).toBeDefined()
    expect(Array.isArray(file.samples)).toBe(true)
    expect(file.samples.length).toBe(2) // Left and right channels
  })

  it('sets selected file index to the newly loaded file', () => {
    const jsonString = JSON.stringify({
      name: 'Test Break',
      artist: 'Test Artist',
      year: 2020,
      base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      slices: [],
      whosampledLink: '',
      whosampledCount: 0,
    })

    loadJson(jsonString)

    expect(SelectedFileIndex.ref()).toBe(0)
  })

  it('appends to existing loaded files', () => {
    // Load first file
    const jsonString1 = JSON.stringify({
      name: 'First Break',
      artist: 'Artist 1',
      year: 2020,
      base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      slices: [],
      whosampledLink: '',
      whosampledCount: 0,
    })
    loadJson(jsonString1)

    // Load second file
    const jsonString2 = JSON.stringify({
      name: 'Second Break',
      artist: 'Artist 2',
      year: 2021,
      base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      slices: [],
      whosampledLink: '',
      whosampledCount: 0,
    })
    loadJson(jsonString2)

    const loadedFiles = LoadedFiles.ref()
    expect(loadedFiles.length).toBe(2)
    expect(loadedFiles[0].name).toBe('First Break')
    expect(loadedFiles[1].name).toBe('Second Break')
    expect(SelectedFileIndex.ref()).toBe(1) // Should select the last loaded file
  })

  it('preserves pre-sliced break data', () => {
    const slices = [
      { start: 0, type: 'Kick' as const, stepNum: 0 },
      { start: 5000, type: 'Hat' as const, stepNum: 2 },
      { start: 10000, type: 'Snare' as const, stepNum: 4 },
      { start: 15000, type: 'Hat' as const, stepNum: 6 },
    ]

    const jsonString = JSON.stringify({
      name: 'Pre-sliced Break',
      artist: 'Test Artist',
      year: 2020,
      base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      slices,
      whosampledLink: '',
      whosampledCount: 0,
    })

    loadJson(jsonString)

    const file = LoadedFiles.ref()[0]
    expect(file.slices).toEqual(slices)
    expect(file.slices.length).toBe(4)
  })
})
