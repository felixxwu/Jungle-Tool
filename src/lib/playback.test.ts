import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateDuration, stopPlayback, startPlayback, setupPlayerStopHandler } from './playback'
import { SAMPLE_RATE } from './consts'
import { Player, Playing, PlayStartTimestamp, PlayDuration } from './store'

describe('calculateDuration', () => {
  it('calculates duration correctly for sample count', () => {
    const sampleCount = 44100 // 1 second at 44.1kHz
    const expected = sampleCount / SAMPLE_RATE
    expect(calculateDuration(sampleCount)).toBe(expected)
    expect(calculateDuration(sampleCount)).toBe(1)
  })

  it('handles zero samples', () => {
    expect(calculateDuration(0)).toBe(0)
  })

  it('handles large sample counts', () => {
    const sampleCount = 441000 // 10 seconds
    expect(calculateDuration(sampleCount)).toBe(10)
  })
})

describe('stopPlayback', () => {
  beforeEach(() => {
    // Reset state before each test
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
  })

  it('stops the player and clears all playback state', () => {
    // Setup: simulate playing state
    const mockStop = vi.fn()
    const mockPlayer = { stop: mockStop }
    Player.set(mockPlayer as any)
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(10)

    // Action: stop playback
    stopPlayback()

    // Verify: player was stopped and all state cleared
    expect(mockStop).toHaveBeenCalledTimes(1)
    expect(Playing.ref()).toBe(false)
    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
  })

  it('handles null player gracefully', () => {
    // Setup: playing state but no player
    Player.set(null)
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(5)

    // Action: stop playback
    stopPlayback()

    // Verify: state still cleared even without player
    expect(Playing.ref()).toBe(false)
    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
  })
})

describe('startPlayback', () => {
  beforeEach(() => {
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
  })

  it('sets timestamp and duration when starting playback', () => {
    const mockPlayer = {
      start: vi.fn(),
    } as any

    const duration = 5.5
    startPlayback(mockPlayer, duration)

    expect(mockPlayer.start).toHaveBeenCalledTimes(1)
    expect(PlayStartTimestamp.ref()).not.toBe(null)
    expect(PlayDuration.ref()).toBe(duration)
  })

  it('sets timestamp to current time', () => {
    const mockPlayer = { start: vi.fn() } as any
    const beforeTime = Date.now()

    startPlayback(mockPlayer, 10)

    const timestamp = PlayStartTimestamp.ref()
    const afterTime = Date.now()

    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })

  it('handles null duration', () => {
    const mockPlayer = { start: vi.fn() } as any

    startPlayback(mockPlayer, null)

    expect(PlayDuration.ref()).toBe(null)
    expect(PlayStartTimestamp.ref()).not.toBe(null)
  })

  it('handles undefined duration', () => {
    const mockPlayer = { start: vi.fn() } as any

    startPlayback(mockPlayer, undefined)

    expect(PlayDuration.ref()).toBe(null)
  })
})

describe('setupPlayerStopHandler', () => {
  beforeEach(() => {
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
  })

  it('sets up handler that clears state when player stops', () => {
    const mockPlayer = {
      onstop: null,
    } as any

    // Setup initial state
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(10)

    // Action: setup stop handler
    setupPlayerStopHandler(mockPlayer)

    // Verify handler was set
    expect(mockPlayer.onstop).not.toBe(null)

    // Simulate player stopping
    mockPlayer.onstop()

    // Verify state was cleared
    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
    // Playing should NOT be cleared by default
    expect(Playing.ref()).toBe(true)
  })

  it('clears Playing state when clearPlaying option is true', () => {
    const mockPlayer = {
      onstop: null,
    } as any

    Playing.set(true)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(10)

    setupPlayerStopHandler(mockPlayer, { clearPlaying: true })

    mockPlayer.onstop()

    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
    expect(Playing.ref()).toBe(false)
  })
})
