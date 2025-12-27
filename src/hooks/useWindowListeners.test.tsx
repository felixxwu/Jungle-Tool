import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '../test/test-utils'
import { useWindowListeners } from './useWindowListeners'
import { WindowSize, Playing } from '../lib/store'
import { playArrangement } from '../actions/playArrangement'
import { stopPlayback } from '../lib/playback'

// Mock actions
vi.mock('../actions/playArrangement', () => ({
  playArrangement: vi.fn(),
}))

vi.mock('../lib/playback', () => ({
  stopPlayback: vi.fn(),
}))

describe('useWindowListeners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    WindowSize.set({ width: 1200, height: 800 })
    Playing.set(false)
  })

  afterEach(() => {
    // Event listeners are now properly cleaned up by the hook
  })

  it('updates WindowSize on window resize', () => {
    const TestComponent = () => {
      useWindowListeners()
      return null
    }
    render(<TestComponent />)

    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    })

    window.dispatchEvent(new Event('resize'))

    // WindowSize should be updated
    const windowSize = WindowSize.ref()
    expect(windowSize.width).toBe(800)
    expect(windowSize.height).toBe(600)
  })

  it('stops playback when spacebar is pressed and playing', () => {
    vi.clearAllMocks()
    Playing.set(true)
    ;(stopPlayback as ReturnType<typeof vi.fn>).mockClear()
    const TestComponent = () => {
      useWindowListeners()
      return null
    }
    const { unmount } = render(<TestComponent />)

    const keydownEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    window.dispatchEvent(keydownEvent)

    expect(stopPlayback).toHaveBeenCalled()
    expect(playArrangement).not.toHaveBeenCalled()

    // Verify cleanup works - listeners should be removed after unmount
    unmount()
    const stopPlaybackCallCount = (stopPlayback as ReturnType<typeof vi.fn>).mock.calls.length
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    // stopPlayback should not be called again after unmount
    expect((stopPlayback as ReturnType<typeof vi.fn>).mock.calls.length).toBe(stopPlaybackCallCount)
  })

  it('starts playback when spacebar is pressed and not playing', () => {
    vi.clearAllMocks()
    Playing.set(false)
    // Clear mocks to start fresh for this test
    ;(stopPlayback as ReturnType<typeof vi.fn>).mockClear()
    ;(playArrangement as ReturnType<typeof vi.fn>).mockClear()

    const TestComponent = () => {
      useWindowListeners()
      return null
    }
    const { unmount } = render(<TestComponent />)

    const keydownEvent = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(keydownEvent)

    // Playing should be set to true and playArrangement should be called
    expect(Playing.ref()).toBe(true)
    expect(playArrangement).toHaveBeenCalled()
    expect(stopPlayback).not.toHaveBeenCalled()

    // Verify cleanup works
    unmount()
    const playArrangementCallCount = (playArrangement as ReturnType<typeof vi.fn>).mock.calls.length
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    // playArrangement should not be called again after unmount
    expect((playArrangement as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      playArrangementCallCount
    )
  })

  it('does not handle other keys', () => {
    Playing.set(false)
    const TestComponent = () => {
      useWindowListeners()
      return null
    }
    render(<TestComponent />)

    const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    window.dispatchEvent(keydownEvent)

    expect(playArrangement).not.toHaveBeenCalled()
    expect(stopPlayback).not.toHaveBeenCalled()
  })

  it('handles multiple resize events', () => {
    const TestComponent = () => {
      useWindowListeners()
      return null
    }
    render(<TestComponent />)

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })
    window.dispatchEvent(new Event('resize'))

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1000,
    })
    window.dispatchEvent(new Event('resize'))

    const windowSize = WindowSize.ref()
    expect(windowSize.width).toBe(1000)
  })
})
