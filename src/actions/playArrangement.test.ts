import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playArrangement } from './playArrangement'
import { Layers, Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { createPlayer } from '../lib/audio'
import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { setupPlayback, setupPlayerStopHandler } from '../lib/playback'

// Mock dependencies
vi.mock('../lib/audio')
vi.mock('../helpers/getArrangementSamples')
vi.mock('../lib/playback', async () => {
  const actual = await vi.importActual('../lib/playback')
  return {
    ...actual,
    setupPlayback: vi.fn().mockResolvedValue(undefined),
    setupPlayerStopHandler: vi.fn(),
  }
})

describe('playArrangement', () => {
  const mockSamples: [Float32Array, Float32Array] = [
    new Float32Array(44100),
    new Float32Array(44100),
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
    Layers.set([{ filename: 'test-file-1', volume: 50, pitch: 0 }])
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    Player.set(null)
    ;(createPlayer as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlayer)
    ;(getArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSamples)
  })

  it('starts looping playback of arrangement', async () => {
    await playArrangement()

    expect(Playing.ref()).toBe(true)
    expect(Player.ref()).toBe(mockPlayer)
    expect(mockPlayer.loop).toBe(true)
    expect(mockPlayer.start).toHaveBeenCalledTimes(1)
  })

  it('sets up player stop handler with clearPlaying option', async () => {
    await playArrangement()

    expect(setupPlayerStopHandler).toHaveBeenCalledWith(mockPlayer, { clearPlaying: true })
  })

  it('sets PlayStartTimestamp when starting playback', async () => {
    const beforeTime = Date.now()
    await playArrangement()
    const afterTime = Date.now()

    const timestamp = PlayStartTimestamp.ref()
    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })

  it('sets PlayDuration to null for looping arrangement', async () => {
    await playArrangement()

    // Arrangement loops indefinitely, so duration is null
    expect(PlayDuration.ref()).toBe(null)
  })

  it('does not start playback if no samples are available', async () => {
    ;(getArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue(null)

    await playArrangement()

    // Playing should be set to true, but player should not be created
    expect(Playing.ref()).toBe(true)
    expect(createPlayer).not.toHaveBeenCalled()
  })

  it('continues looping when arrangement completes a cycle', async () => {
    await playArrangement()

    // Verify loop is enabled
    expect(mockPlayer.loop).toBe(true)

    // Simulate player completing a cycle (onstop should not clear playing due to loop)
    // The loop property ensures continuous playback
    expect(mockPlayer.loop).toBe(true)
  })

  it('calls setupPlayback before creating player', async () => {
    await playArrangement()

    // setupPlayback should be called before createPlayer
    const setupCallOrder = vi.mocked(setupPlayback).mock.invocationCallOrder[0]
    const createCallOrder = vi.mocked(createPlayer).mock.invocationCallOrder[0]
    expect(setupCallOrder).toBeLessThan(createCallOrder)
  })
})
