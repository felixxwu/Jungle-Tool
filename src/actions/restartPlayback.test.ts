import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { restartPlayback } from './restartPlayback'
import { Player } from '../lib/store'
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
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('restarts playback if player is currently playing', async () => {
    mockPlayer.state = 'started'
    Player.set(mockPlayer)

    restartPlayback()

    // Wait for debounce (200ms) - need to use runAllTimersAsync for setTimeout
    await vi.runAllTimersAsync()

    expect(playArrangement).toHaveBeenCalledTimes(1)
  })

  it('does not restart playback if player is stopped', async () => {
    mockPlayer.state = 'stopped'
    Player.set(mockPlayer)

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

    restartPlayback()

    // Change state during debounce - the function checks state when it executes
    mockPlayer.state = 'stopped'
    Player.set(mockPlayer)

    await vi.runAllTimersAsync()

    // Should not call because state was stopped when function executed
    expect(playArrangement).not.toHaveBeenCalled()
  })
})

