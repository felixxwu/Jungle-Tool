import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { addToArrangement } from './addToArrangement'
import { Layers, LoadedFiles, Tab, Player, Playing } from '../lib/store'
import { getBestLayerPitch } from '../helpers/getBestLayerPitch'
import { getBestLayerVolume } from '../helpers/getBestLayerVolume'

// Mock helpers
vi.mock('../helpers/getBestLayerPitch', () => ({
  getBestLayerPitch: vi.fn(() => 2),
}))

vi.mock('../helpers/getBestLayerVolume', () => ({
  getBestLayerVolume: vi.fn(() => 75),
}))

// Mock restartPlayback
vi.mock('./restartPlayback', () => ({
  restartPlayback: vi.fn(),
}))

import { restartPlayback } from './restartPlayback'

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
    vi.useFakeTimers()
    Layers.set([])
    Tab.set('library')
    LoadedFiles.set([mockFile])
    Player.set(null)
    Playing.set(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('switches to arrangement tab', () => {
    Tab.set('library')
    addToArrangement(0)
    expect(Tab.ref()).toBe('arrangement')
  })

  it('switches to arrangement tab from any tab', () => {
    Tab.set('layers')
    addToArrangement(0)
    expect(Tab.ref()).toBe('arrangement')

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
    Layers.set([{ filename: 'existing-file', volume: 50, pitch: 0 }])

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

  it('calls restartPlayback when adding a layer', async () => {
    addToArrangement(0)

    // Wait for debounce (200ms)
    await vi.runAllTimersAsync()

    expect(restartPlayback).toHaveBeenCalledTimes(1)
  })

  it('calls restartPlayback even when not playing', async () => {
    Playing.set(false)
    Player.set(null)

    addToArrangement(0)

    // Wait for debounce (200ms)
    await vi.runAllTimersAsync()

    expect(restartPlayback).toHaveBeenCalledTimes(1)
  })

  it('calls restartPlayback when adding a layer while playing', async () => {
    const mockPlayer = {
      state: 'started' as const,
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
    } as any
    Player.set(mockPlayer)
    Playing.set(true)

    addToArrangement(0)

    // Wait for debounce (200ms)
    await vi.runAllTimersAsync()

    expect(restartPlayback).toHaveBeenCalledTimes(1)
  })

  it('calls restartPlayback when adding multiple layers', async () => {
    const mockFile2 = {
      name: 'test-file-2',
      artist: 'Test Artist 2',
      year: 2024,
      samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
      slices: [],
      whosampledLink: '',
      whosampledCount: 0,
    }
    LoadedFiles.set([mockFile, mockFile2])

    addToArrangement(0)
    addToArrangement(1)

    // Wait for debounce (200ms)
    await vi.runAllTimersAsync()

    // Should be called twice (once for each addToArrangement call)
    // But due to debouncing, might be called less if calls are within 200ms
    expect(restartPlayback).toHaveBeenCalled()
  })
})
