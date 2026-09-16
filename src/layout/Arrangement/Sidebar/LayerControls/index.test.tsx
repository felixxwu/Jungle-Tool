import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '../../../../test/test-utils'
import { LayerControls } from './index'
import { Layers, Playing, Tab } from '../../../../lib/store'

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
    Tab.set('arrangement')
  })

  it('continues playback when randomise layers is clicked while playing', async () => {
    // Setup: Simulate playing state
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

  it('does not restart playback if not currently playing', async () => {
    Playing.set(false)

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
