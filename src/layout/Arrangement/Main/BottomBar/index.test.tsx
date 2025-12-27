import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../../../../test/test-utils'
import { BottomBar } from './index'
import { Playing, Player, Tab, LibraryLoading, Modal } from '../../../../lib/store'
import { playArrangement } from '../../../../actions/playArrangement'
import { randomiseArrangement } from '../../../../actions/randomiseArrangement'
import { stopPlayback } from '../../../../lib/playback'

// Mock the actions
vi.mock('../../../../actions/playArrangement', () => ({
  playArrangement: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../actions/randomiseArrangement', () => ({
  randomiseArrangement: vi.fn(),
}))

vi.mock('../../../../lib/playback', () => ({
  stopPlayback: vi.fn(),
}))

describe('BottomBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Playing.set(false)
    Player.set(null)
    Tab.set('arrangement')
    LibraryLoading.set(false)
  })

  it('shows Play button when not playing', () => {
    render(<BottomBar />)
    expect(screen.getByText('Play')).toBeInTheDocument()
    expect(screen.queryByText('Pause')).not.toBeInTheDocument()
  })

  it('shows Pause button when playing', () => {
    Playing.set(true)
    render(<BottomBar />)
    expect(screen.getByText('Pause')).toBeInTheDocument()
    expect(screen.queryByText('Play')).not.toBeInTheDocument()
  })

  it('starts playback when Play button is clicked', async () => {
    render(<BottomBar />)

    const playButton = screen.getByText('Play')
    await act(async () => {
      playButton.click()
    })

    expect(playArrangement).toHaveBeenCalledTimes(1)
  })

  it('stops playback when Pause button is clicked', async () => {
    Playing.set(true)
    const mockPlayer = {
      state: 'started',
      stop: vi.fn(),
    } as any
    Player.set(mockPlayer)

    render(<BottomBar />)

    const pauseButton = screen.getByText('Pause')
    await act(async () => {
      pauseButton.click()
    })

    expect(stopPlayback).toHaveBeenCalledTimes(1)
  })

  it('shows Randomise notes button when not on layers tab', () => {
    Tab.set('arrangement')
    render(<BottomBar />)

    expect(screen.getByText('Randomise notes')).toBeInTheDocument()
  })

  it('does not show Randomise notes button when on layers tab', () => {
    Tab.set('layers')
    render(<BottomBar />)

    expect(screen.queryByText('Randomise notes')).not.toBeInTheDocument()
  })

  it('calls randomiseArrangement when Randomise notes is clicked', async () => {
    Tab.set('arrangement')
    render(<BottomBar />)

    const randomiseButton = screen.getByText('Randomise notes')
    await act(async () => {
      randomiseButton.click()
    })

    // Wait for the setTimeout in the component to complete
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    // Verify randomiseArrangement was called
    expect(randomiseArrangement).toHaveBeenCalledTimes(1)
  })

  it('shows Export button', () => {
    render(<BottomBar />)
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('opens Export modal when Export button is clicked', async () => {
    Modal.set(null) // Ensure modal is closed initially
    render(<BottomBar />)

    const exportButton = screen.getByText('Export')
    await act(async () => {
      exportButton.click()
    })

    // Verify Modal was set (should contain ExportModal component)
    const modal = Modal.ref()
    expect(modal).not.toBe(null)
  })

  it('disables Play button when library is loading', async () => {
    LibraryLoading.set(true)
    render(<BottomBar />)

    const playButton = screen.getByText('Play')
    expect(playButton).toBeInTheDocument()

    // Verify disabled state: clicking should NOT trigger playArrangement
    // When disabled, the Text component sets onClick to undefined
    await act(async () => {
      playButton.click()
    })

    // playArrangement should NOT be called because the button is disabled
    expect(playArrangement).not.toHaveBeenCalled()
  })
})
