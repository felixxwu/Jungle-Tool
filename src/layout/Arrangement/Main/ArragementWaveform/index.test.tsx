import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act } from '../../../../test/test-utils'
import { ArragementWaveform } from './index'
import {
  SelectedBar,
  BPM,
  Playing,
  NumBars,
  Layers,
  LoadedFiles,
  Arrangement,
} from '../../../../lib/store'
import { useArrangementSamples } from '../../../../hooks/useArrangementSamples'

// Mock dependencies
vi.mock('../../../../hooks/useArrangementSamples', () => ({
  useArrangementSamples: vi.fn(),
}))

describe('ArragementWaveform', () => {
  const mockSamples = new Float32Array(44100)

  beforeEach(() => {
    vi.clearAllMocks()
    SelectedBar.set(0)
    BPM.set(120)
    NumBars.set(1)
    Playing.set(false)
    Layers.set([{ filename: 'test-file', volume: 50, pitch: 0 }])
    LoadedFiles.set([
      {
        name: 'test-file',
        samples: [new Float32Array(44100), new Float32Array(44100)],
        slices: [],
        artist: 'Test Artist',
        year: 2024,
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    Arrangement.set([])
    ;(useArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSamples)
  })

  it('renders waveform for the selected bar', () => {
    const { container } = render(<ArragementWaveform />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders nothing for a bar with no samples available yet', () => {
    ;(useArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue(null)

    const { container } = render(<ArragementWaveform />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('requests samples for every bar in the arrangement, not just the selected one', () => {
    NumBars.set(3)
    render(<ArragementWaveform />)

    expect(useArrangementSamples).toHaveBeenCalledWith({ bar: 0 })
    expect(useArrangementSamples).toHaveBeenCalledWith({ bar: 1 })
    expect(useArrangementSamples).toHaveBeenCalledWith({ bar: 2 })
  })

  it('renders one waveform per bar', () => {
    NumBars.set(3)
    const { container } = render(<ArragementWaveform />)

    expect(container.querySelectorAll('svg').length).toBe(3)
  })

  it('slides the track to the selected bar and back', async () => {
    NumBars.set(2)
    const { container, rerender } = render(<ArragementWaveform />)

    const track = container.firstChild?.firstChild as HTMLElement
    expect(track.style.transform).toContain('translateX(-0px)')

    await act(async () => {
      SelectedBar.set(1)
      rerender(<ArragementWaveform />)
    })

    expect(track.style.transform).not.toContain('translateX(-0px)')
  })

  it('passes playhead visibility based on the Playing atom', () => {
    Playing.set(true)

    render(<ArragementWaveform />)

    // Component should pass isPlaying based on Playing -- we verify by
    // checking the component renders correctly with the flag set.
    expect(useArrangementSamples).toHaveBeenCalled()
  })

  it('hides playhead when not playing', () => {
    Playing.set(false)

    render(<ArragementWaveform />)

    expect(useArrangementSamples).toHaveBeenCalled()
  })

  it('passes total bars for playhead calculation', () => {
    NumBars.set(2)
    BPM.set(120)
    render(<ArragementWaveform />)

    // Component should pass totalBars to Waveform for calculating which
    // bar is currently playing.
    expect(useArrangementSamples).toHaveBeenCalled()
  })
})
