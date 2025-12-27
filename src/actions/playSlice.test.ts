import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playSlice } from './playSlice'
import { LoadedFiles, Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { createPlayer } from '../lib/audio'
import { getSliceSamples } from '../helpers/getSliceSamples'
import { calculateDuration } from '../lib/playback'

// Mock dependencies
vi.mock('../lib/audio')
vi.mock('../helpers/getSliceSamples')
vi.mock('../lib/playback', async () => {
  const actual = await vi.importActual('../lib/playback')
  return {
    ...actual,
    setupPlayback: vi.fn().mockResolvedValue(undefined),
    setupPlayerStopHandler: vi.fn(),
  }
})

describe('playSlice', () => {
  const mockFile = {
    name: 'test-file',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [
      { start: 1000, type: 'Kick' as const, stepNum: 0 },
      { start: 5000, type: 'Snare' as const, stepNum: 4 },
      { start: 10000, type: 'Hat' as const, stepNum: 8 },
    ],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockSliceSamples: [Float32Array, Float32Array] = [
    new Float32Array(5000), // Slice samples
    new Float32Array(5000),
  ]

  const mockPlayer = {
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    loop: false,
    state: 'stopped',
    onstop: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([mockFile])
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    Player.set(null)
    ;(createPlayer as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlayer)
    ;(getSliceSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSliceSamples)
  })

  it('previews a slice by playing it', async () => {
    await playSlice(0, 0) // Play first slice

    expect(getSliceSamples).toHaveBeenCalledWith(mockFile, 0)
    expect(createPlayer).toHaveBeenCalledWith(mockSliceSamples)
    expect(Player.ref()).toBe(mockPlayer)
    expect(mockPlayer.start).toHaveBeenCalled()
  })

  it('sets Playing to false when called', async () => {
    Playing.set(true)

    await playSlice(0, 0)

    expect(Playing.ref()).toBe(false)
  })

  it('calculates duration based on slice samples length', async () => {
    await playSlice(0, 0)

    const expectedDuration = calculateDuration(mockSliceSamples[0].length)
    expect(PlayDuration.ref()).toBe(expectedDuration)
  })

  it('sets PlayStartTimestamp when starting playback', async () => {
    const beforeTime = Date.now()
    await playSlice(0, 0)
    const afterTime = Date.now()

    const timestamp = PlayStartTimestamp.ref()
    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })

  it('previews different slices correctly', async () => {
    await playSlice(0, 1) // Play second slice

    expect(getSliceSamples).toHaveBeenCalledWith(mockFile, 1)
    expect(createPlayer).toHaveBeenCalled()
  })

  it('handles slice with zero length', async () => {
    const emptySliceSamples: [Float32Array, Float32Array] = [
      new Float32Array(0),
      new Float32Array(0),
    ]
    ;(getSliceSamples as ReturnType<typeof vi.fn>).mockReturnValue(emptySliceSamples)

    await playSlice(0, 0)

    expect(PlayDuration.ref()).toBe(0)
    expect(PlayStartTimestamp.ref()).not.toBe(null)
  })

  it('does not loop slice playback', async () => {
    await playSlice(0, 0)

    // Slices should not loop (unlike arrangement and trim)
    expect(mockPlayer.loop).toBe(false)
  })
})
