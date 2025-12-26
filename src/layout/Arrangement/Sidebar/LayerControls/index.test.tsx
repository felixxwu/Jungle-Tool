import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '../../../../test/test-utils'
import { LayerControls } from './index'
import { Layers, Playing, Player, Tab } from '../../../../lib/store'

// Mock the actions
vi.mock('../../../../actions/randomiseLayers', () => ({
  randomiseLayers: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../actions/playArrangement', () => ({
  playArrangement: vi.fn().mockResolvedValue(undefined),
}))

import { randomiseLayers } from '../../../../actions/randomiseLayers'
import { playArrangement } from '../../../../actions/playArrangement'

describe('LayerControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state
    Layers.set([
      { filename: 'test-file-1', volume: 50, pitch: 0 },
      { filename: 'test-file-2', volume: 50, pitch: 0 },
    ])
    Playing.set(false)
    Player.set(null)
    Tab.set('arrangement')
  })

  it('continues playback when randomise layers is clicked while playing', async () => {
    // Setup: Simulate playing state
    const mockStop = vi.fn()
    let mockPlayer = {
      state: 'started' as const,
      stop: mockStop,
    } as any
    Player.set(mockPlayer)
    Playing.set(true)

    render(<LayerControls />)

    const randomiseButton = screen.getByText('Randomise Layers ›')
    expect(randomiseButton).toBeInTheDocument()

    // Click the randomise button
    await act(async () => {
      randomiseButton.click()
    })

    // Wait for randomiseLayers to complete
    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
    })

    // Simulate player stopping after randomisation (before safeguard check)
    // This tests the safeguard logic
    await act(async () => {
      await new Promise(r => setTimeout(r, 100))
      Player.set(null) // Player stops
    })

    // Wait for the safeguard delay (250ms total)
    await act(async () => {
      await new Promise(r => setTimeout(r, 200))
    })

    // Verify playArrangement was called by the safeguard to restart playback
    expect(playArrangement).toHaveBeenCalledTimes(1)
  })

  it('does not restart playback when randomise layers is clicked while not playing', async () => {
    // Setup: Not playing
    Playing.set(false)
    Player.set(null)

    // randomiseLayers is already mocked

    render(<LayerControls />)

    const randomiseButton = screen.getByText('Randomise Layers ›')
    expect(randomiseButton).toBeInTheDocument()

    // Click the randomise button
    await act(async () => {
      randomiseButton.click()
    })

    // Wait for randomiseLayers to complete
    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
    })

    // Wait a bit to ensure playArrangement is not called
    await new Promise(r => setTimeout(r, 300))

    // playArrangement should NOT be called when not playing
    expect(playArrangement).not.toHaveBeenCalled()
  })

  it('does not restart playback if player state is not started', async () => {
    // Setup: Player exists but is not started
    const mockPlayer = {
      state: 'stopped',
      stop: vi.fn(),
    } as any
    Player.set(mockPlayer)
    Playing.set(false) // Not playing even though player exists

    // randomiseLayers is already mocked

    render(<LayerControls />)

    const randomiseButton = screen.getByText('Randomise Layers ›')

    await act(async () => {
      randomiseButton.click()
    })

    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
    })

    // Wait a bit
    await new Promise(r => setTimeout(r, 300))

    // playArrangement should NOT be called when player is not started
    expect(playArrangement).not.toHaveBeenCalled()
  })

  it('restarts playback if it stops after randomisation', async () => {
    // Setup: Playing state
    const mockPlayer = {
      state: 'started',
      stop: vi.fn(),
    } as any
    Player.set(mockPlayer)
    Playing.set(true)

    // randomiseLayers is already mocked

    render(<LayerControls />)

    const randomiseButton = screen.getByText('Randomise Layers ›')

    await act(async () => {
      randomiseButton.click()
    })

    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
    })

    // Simulate player stopping after randomisation
    Player.set(null)

    // Wait for the safeguard delay
    await waitFor(
      () => {
        expect(playArrangement).toHaveBeenCalledTimes(1)
      },
      { timeout: 500 }
    )
  })
})
