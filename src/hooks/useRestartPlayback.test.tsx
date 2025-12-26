import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRestartPlayback } from './useRestartPlayback'
import { Layers, Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'

// Mock the actions
vi.mock('../actions/restartPlayback', () => ({
  restartPlayback: vi.fn(),
}))

describe('useRestartPlayback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state
    Layers.set([
      { filename: 'test-file-1', volume: 50, pitch: 0 },
      { filename: 'test-file-2', volume: 50, pitch: 0 },
    ])
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
  })

  it('stops playback when all layers are removed', () => {
    // Setup: Simulate playing state with a mock player
    const mockStop = vi.fn()
    const mockPlayer = {
      state: 'started',
      stop: mockStop,
    } as any
    Player.set(mockPlayer)
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(10)

    // Render hook with layers
    const { rerender } = renderHook(() => useRestartPlayback())

    // Verify initial state
    expect(Layers.ref().length).toBe(2)
    expect(Playing.ref()).toBe(true)

    // Remove all layers
    Layers.set([])

    // Rerender to trigger hook effect
    rerender()

    // Verify player was stopped
    expect(mockStop).toHaveBeenCalledTimes(1)

    // Verify playback state was cleared
    expect(Playing.ref()).toBe(false)
    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
  })

  it('does not stop playback if player is not started', () => {
    // Setup: Player exists but is not started
    const mockStop = vi.fn()
    const mockPlayer = {
      state: 'stopped',
      stop: mockStop,
    } as any
    Player.set(mockPlayer)
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())

    const { rerender } = renderHook(() => useRestartPlayback())

    // Remove all layers
    Layers.set([])
    rerender()

    // stopPlayback checks player.state === 'started', so it won't call stopPlayback if state is 'stopped'
    // The hook only calls stopPlayback() if player.state === 'started'
    expect(mockStop).not.toHaveBeenCalled()
    // State remains unchanged because stopPlayback wasn't called
    expect(Playing.ref()).toBe(true)
  })

  it('does not stop playback if layers still exist', () => {
    // Setup: Playing with layers
    const mockStop = vi.fn()
    const mockPlayer = {
      state: 'started',
      stop: mockStop,
    } as any
    Player.set(mockPlayer)
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())

    const { rerender } = renderHook(() => useRestartPlayback())

    // Modify layers but keep at least one
    Layers.set([{ filename: 'test-file-1', volume: 50, pitch: 0 }])
    rerender()

    // stopPlayback should NOT be called when layers still exist
    expect(mockStop).not.toHaveBeenCalled()
    // State should remain unchanged
    expect(Playing.ref()).toBe(true)
  })

  it('handles transition from multiple layers to zero layers', () => {
    // Setup: Start with multiple layers and playing
    const mockStop = vi.fn()
    const mockPlayer = {
      state: 'started',
      stop: mockStop,
    } as any
    Player.set(mockPlayer)
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())

    const { rerender } = renderHook(() => useRestartPlayback())

    // Remove one layer (still has layers)
    Layers.set([{ filename: 'test-file-1', volume: 50, pitch: 0 }])
    rerender()

    expect(mockStop).not.toHaveBeenCalled()
    expect(Playing.ref()).toBe(true)

    // Remove all layers
    Layers.set([])
    rerender()

    // Now stopPlayback should be called
    expect(mockStop).toHaveBeenCalledTimes(1)
    expect(Playing.ref()).toBe(false)
    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
  })
})
