import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playTrim } from './playTrim'
import { LoadedFiles, Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { createPlayer, stereoSlice } from '../lib/audio'
import { calculateDuration, stopPlayback } from '../lib/playback'

// Mock dependencies
vi.mock('../lib/audio')
vi.mock('../lib/playback', async () => {
  const actual = await vi.importActual('../lib/playback')
  return {
    ...actual,
    setupPlayback: vi.fn().mockResolvedValue(undefined),
    setupPlayerStopHandler: vi.fn(),
    stopPlayback: vi.fn(),
  }
})

describe('playTrim', () => {
  const mockFile = {
    name: 'test-file',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [
      { start: 1000, type: 'Start' as const, stepNum: 0 },
      { start: 30000, type: 'End' as const, stepNum: 0 },
    ],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockTrimmedSamples: [Float32Array, Float32Array] = [
    new Float32Array(29000), // Trimmed samples (30000 - 1000)
    new Float32Array(29000),
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
    ;(stereoSlice as ReturnType<typeof vi.fn>).mockReturnValue(mockTrimmedSamples)
  })

  it('previews trimmed section by playing it', async () => {
    await playTrim(0)

    expect(stereoSlice).toHaveBeenCalledWith(mockFile.samples, 1000, 30000)
    expect(createPlayer).toHaveBeenCalledWith(mockTrimmedSamples)
    expect(Player.ref()).toBe(mockPlayer)
    expect(mockPlayer.start).toHaveBeenCalled()
  })

  it('loops trimmed section playback', async () => {
    await playTrim(0)

    // Trimmed sections should loop (for seamless loop preview)
    expect(mockPlayer.loop).toBe(true)
  })

  it('stops existing playback before starting trim preview', async () => {
    await playTrim(0)

    expect(stopPlayback).toHaveBeenCalledTimes(1)
  })

  it('sets Playing to false when called', async () => {
    Playing.set(true)

    await playTrim(0)

    expect(Playing.ref()).toBe(false)
  })

  it('calculates duration based on trimmed samples length', async () => {
    await playTrim(0)

    const expectedDuration = calculateDuration(mockTrimmedSamples[0].length)
    expect(PlayDuration.ref()).toBe(expectedDuration)
  })

  it('sets PlayStartTimestamp when starting playback', async () => {
    const beforeTime = Date.now()
    await playTrim(0)
    const afterTime = Date.now()

    const timestamp = PlayStartTimestamp.ref()
    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })

  it('uses default start position (0) when Start slice is missing', async () => {
    LoadedFiles.set([
      {
        ...mockFile,
        slices: [{ start: 30000, type: 'End' as const, stepNum: 0 }],
      },
    ])

    await playTrim(0)

    expect(stereoSlice).toHaveBeenCalledWith(expect.any(Array), 0, 30000)
  })

  it('uses file length as end when End slice is missing', async () => {
    LoadedFiles.set([
      {
        ...mockFile,
        slices: [{ start: 1000, type: 'Start' as const, stepNum: 0 }],
      },
    ])

    await playTrim(0)

    expect(stereoSlice).toHaveBeenCalledWith(expect.any(Array), 1000, mockFile.samples[0].length)
  })

  it('handles file with no slices', async () => {
    LoadedFiles.set([
      {
        ...mockFile,
        slices: [],
      },
    ])

    await playTrim(0)

    // Should use default start (0) and file length as end
    expect(stereoSlice).toHaveBeenCalledWith(expect.any(Array), 0, mockFile.samples[0].length)
  })
})
