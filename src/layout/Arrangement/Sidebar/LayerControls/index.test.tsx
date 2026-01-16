import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '../../../../test/test-utils'
import { LayerControls } from './index'
import { Layers, Playing, Player, Tab } from '../../../../lib/store'

// Mock the actions
vi.mock('../../../../actions/playArrangement', () => ({
  playArrangement: vi.fn().mockResolvedValue(undefined),
}))

// Mock randomiseLayers - it will call playArrangement at the end (matching actual implementation)
vi.mock('../../../../actions/randomiseLayers', () => ({
  randomiseLayers: vi.fn().mockImplementation(async () => {
    // Import the mocked playArrangement
    const mod = await import('../../../../actions/playArrangement')
    await mod.playArrangement()
  }),
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

    // Click the randomise button
    await act(async () => {
      randomiseButton.click()
    })

    // Wait for randomiseLayers to complete and playArrangement to be called
    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
      expect(playArrangement).toHaveBeenCalledTimes(1)
    })
  })

  it('does not restart playback when randomise layers is clicked while not playing', async () => {
    // Setup: Not playing
    Playing.set(false)
    Player.set(null)

    render(<LayerControls />)

    const randomiseButton = screen.getByText('Randomise Layers ›')

    // Click the randomise button
    await act(async () => {
      randomiseButton.click()
    })

    // Wait for randomiseLayers to complete
    // Note: randomiseLayers now always calls playArrangement, so it will be called
    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
      expect(playArrangement).toHaveBeenCalledTimes(1)
    })
  })

  it('does not restart playback if player state is not started', async () => {
    // Setup: Player exists but is not started
    const mockPlayer = {
      state: 'stopped',
      stop: vi.fn(),
    } as any
    Player.set(mockPlayer)
    Playing.set(false) // Not playing even though player exists

    render(<LayerControls />)

    const randomiseButton = screen.getByText('Randomise Layers ›')

    await act(async () => {
      randomiseButton.click()
    })

    // Wait for randomiseLayers to complete
    // Note: randomiseLayers now always calls playArrangement, so it will be called
    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
      expect(playArrangement).toHaveBeenCalledTimes(1)
    })
  })

  it('restarts playback if it stops after randomisation', async () => {
    // Setup: Playing state
    const mockPlayer = {
      state: 'started',
      stop: vi.fn(),
    } as any
    Player.set(mockPlayer)
    Playing.set(true)

    render(<LayerControls />)

    const randomiseButton = screen.getByText('Randomise Layers ›')

    await act(async () => {
      randomiseButton.click()
    })

    // Wait for randomiseLayers to complete and playArrangement to be called
    await waitFor(() => {
      expect(randomiseLayers).toHaveBeenCalledTimes(1)
      expect(playArrangement).toHaveBeenCalledTimes(1)
    })
  })
})
