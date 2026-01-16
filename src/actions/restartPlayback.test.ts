import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { restartPlayback } from './restartPlayback'
import { Player, Playing } from '../lib/store'
import { playArrangement } from './playArrangement'

// Mock playArrangement
vi.mock('./playArrangement', () => ({
  playArrangement: vi.fn(),
}))

describe('restartPlayback', () => {
  const mockPlayer = {
    state: 'stopped',
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    Player.set(null)
    Playing.set(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('restarts playback if player is currently playing', async () => {
    mockPlayer.state = 'started'
    Player.set(mockPlayer)
    Playing.set(true)

    restartPlayback()

    // Wait for debounce (200ms) - need to use runAllTimersAsync for setTimeout
    await vi.runAllTimersAsync()

    expect(playArrangement).toHaveBeenCalledTimes(1)
  })

  it('does not restart playback if player is stopped', async () => {
    mockPlayer.state = 'stopped'
    Player.set(mockPlayer)
    Playing.set(false)

    restartPlayback()

    // Wait for debounce
    await vi.runAllTimersAsync()

    expect(playArrangement).not.toHaveBeenCalled()
  })

  it('does not restart playback if Playing state is false', async () => {
    mockPlayer.state = 'started'
    Player.set(mockPlayer)
    Playing.set(false)

    restartPlayback()

    // Wait for debounce
    await vi.runAllTimersAsync()

    expect(playArrangement).not.toHaveBeenCalled()
  })

  it('does not restart playback if player is null', async () => {
    Player.set(null)

    restartPlayback()

    // Wait for debounce
    await vi.runAllTimersAsync()

    expect(playArrangement).not.toHaveBeenCalled()
  })

  it('debounces multiple calls', async () => {
    mockPlayer.state = 'started'
    Player.set(mockPlayer)
    Playing.set(true)

    restartPlayback()
    restartPlayback()
    restartPlayback()

    // Wait for debounce
    await vi.runAllTimersAsync()

    // Should only call once due to debouncing
    expect(playArrangement).toHaveBeenCalledTimes(1)
  })

  it('checks player state when debounced function executes', async () => {
    mockPlayer.state = 'started'
    Player.set(mockPlayer)
    Playing.set(true)

    restartPlayback()

    // Change state during debounce - the function checks state when it executes
    mockPlayer.state = 'stopped'
    Player.set(mockPlayer)
    Playing.set(false)

    await vi.runAllTimersAsync()

    // Should not call because state was stopped when function executed
    expect(playArrangement).not.toHaveBeenCalled()
  })
})
