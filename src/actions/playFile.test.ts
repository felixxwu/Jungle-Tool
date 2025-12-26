import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playFile } from './playFile'
import { LoadedFiles, Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { createPlayer } from '../lib/audio'
import { calculateDuration } from '../lib/playback'

// Mock only external dependencies that interact with browser/audio APIs
vi.mock('../lib/audio')
vi.mock('../lib/playback', async () => {
  const actual = await vi.importActual('../lib/playback')
  return {
    ...actual,
    setupPlayback: vi.fn().mockResolvedValue(undefined),
    setupPlayerStopHandler: vi.fn(),
    // Don't mock startPlayback - we want to test actual state changes
  }
})

describe('playFile', () => {
  const mockFile = {
    name: 'test-file',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array], // 1 second of audio
    slices: [],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockPlayer = {
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    loop: false,
    state: 'stopped',
    onstop: null,
  }

  beforeEach(() => {
    // Reset state before each test
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    Player.set(null)

    // Setup mock data
    LoadedFiles.set([mockFile])
    ;(createPlayer as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlayer)
  })

  it('sets Playing to false when called', async () => {
    Playing.set(true) // Start with playing state

    await playFile(0)

    expect(Playing.ref()).toBe(false)
  })

  it('sets the player in store after creating it', async () => {
    await playFile(0)

    expect(Player.ref()).toBe(mockPlayer)
  })

  it('sets PlayStartTimestamp and PlayDuration after starting playback', async () => {
    await playFile(0)

    // Verify actual state changes from startPlayback
    expect(PlayStartTimestamp.ref()).not.toBe(null)
    expect(PlayDuration.ref()).toBe(calculateDuration(mockFile.samples[0].length))
    expect(PlayDuration.ref()).toBe(1) // 1 second
  })

  it('calculates duration correctly for different file lengths', async () => {
    const mockFile2 = {
      ...mockFile,
      name: 'test-file-2',
      samples: [new Float32Array(88200), new Float32Array(88200)] as [Float32Array, Float32Array], // 2 seconds
    }
    LoadedFiles.set([mockFile, mockFile2])

    await playFile(1)

    // Verify state reflects correct duration for the second file
    const expectedDuration = calculateDuration(mockFile2.samples[0].length)
    expect(PlayDuration.ref()).toBe(expectedDuration)
    expect(PlayDuration.ref()).toBe(2) // 2 seconds
  })

  it('handles file with zero samples', async () => {
    const emptyFile = {
      ...mockFile,
      samples: [new Float32Array(0), new Float32Array(0)] as [Float32Array, Float32Array],
    }
    LoadedFiles.set([emptyFile])

    await playFile(0)

    expect(PlayDuration.ref()).toBe(0)
    expect(PlayStartTimestamp.ref()).not.toBe(null)
  })

  it('sets timestamp to current time when starting playback', async () => {
    const beforeTime = Date.now()
    await playFile(0)
    const afterTime = Date.now()

    const timestamp = PlayStartTimestamp.ref()
    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })
})
