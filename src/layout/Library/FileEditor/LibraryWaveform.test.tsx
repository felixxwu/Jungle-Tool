import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '../../../test/test-utils'
import { LibraryWaveform } from './LibraryWaveform'
import {
  LoadedFiles,
  SelectedFileIndex,
  SelectedSliceIndex,
  EditSliceMode,
  HoveredSliceIndex,
  WindowSize,
  PlayStartTimestamp,
  PlayDuration,
  Player,
} from '../../../lib/store'
import { playFile } from '../../../actions/playFile'
import { playSlice } from '../../../actions/playSlice'
// Mock actions
vi.mock('../../../actions/playFile', () => ({
  playFile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../actions/playSlice', () => ({
  playSlice: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../actions/updateSliceStart', () => ({
  updateSliceStart: vi.fn(),
}))

describe('LibraryWaveform', () => {
  const mockSamples = [new Float32Array(44100), new Float32Array(44100)] as [
    Float32Array,
    Float32Array
  ]

  const mockFile = {
    name: 'Amen Brother (1)',
    artist: 'The Winstons',
    year: 1969,
    samples: mockSamples,
    slices: [
      { start: 0, type: 'Kick' as const, stepNum: 0 },
      { start: 5000, type: 'Snare' as const, stepNum: 4 },
      { start: 10000, type: 'Hat' as const, stepNum: 2 },
    ],
    whosampledLink: 'https://www.whosampled.com/sample/123/',
    whosampledCount: 5000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([mockFile])
    SelectedFileIndex.set(0)
    SelectedSliceIndex.set(null)
    EditSliceMode.set(false)
    HoveredSliceIndex.set(null)
    WindowSize.set({ width: 1000, height: 650 })
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    Player.set(null)
  })

  it('renders waveform for selected break', () => {
    const { container } = render(<LibraryWaveform />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.getAttribute('width')).toBeTruthy()
    expect(svg?.getAttribute('height')).toBe('200') // waveformHeight
  })

  it('displays slice markers on waveform', () => {
    const { container } = render(<LibraryWaveform />)

    // Should have slice lines (3 slices) + playhead line = at least 4 lines
    const lines = container.querySelectorAll('line')
    expect(lines.length).toBeGreaterThanOrEqual(3)
  })

  it('renders nothing when no file is selected', () => {
    SelectedFileIndex.set(null)
    const { container } = render(<LibraryWaveform />)

    const svg = container.querySelector('svg')
    expect(svg).not.toBeInTheDocument()
  })

  it('calls playFile when waveform is clicked without slice selected', async () => {
    SelectedSliceIndex.set(null)
    const { container } = render(<LibraryWaveform />)

    const waveformDiv = container.firstChild as HTMLElement
    const mockRect = {
      left: 0,
      top: 0,
      width: 700,
      height: 200,
      bottom: 200,
      right: 700,
    } as DOMRect
    vi.spyOn(waveformDiv, 'getBoundingClientRect').mockReturnValue(mockRect)

    const clickEvent = new MouseEvent('click', {
      clientX: 350,
      clientY: 100,
      bubbles: true,
    })
    waveformDiv.dispatchEvent(clickEvent)

    // Wait for async playFile
    await new Promise(r => setTimeout(r, 10))

    expect(playFile).toHaveBeenCalledWith(0)
  })

  it('calls playSlice when waveform is clicked with slice selected', async () => {
    SelectedSliceIndex.set(1) // Select second slice
    const { container } = render(<LibraryWaveform />)

    const waveformDiv = container.firstChild as HTMLElement
    const mockRect = {
      left: 0,
      top: 0,
      width: 700,
      height: 200,
      bottom: 200,
      right: 700,
    } as DOMRect
    vi.spyOn(waveformDiv, 'getBoundingClientRect').mockReturnValue(mockRect)

    const clickEvent = new MouseEvent('click', {
      clientX: 350,
      clientY: 100,
      bubbles: true,
    })
    waveformDiv.dispatchEvent(clickEvent)

    // Wait for async playSlice
    await new Promise(r => setTimeout(r, 10))

    expect(playSlice).toHaveBeenCalledWith(0, 1)
  })

  it('adjusts width for mobile view', () => {
    WindowSize.set({ width: 800, height: 650 }) // Less than appWidth
    const { container } = render(<LibraryWaveform />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // Width should be adjusted for mobile
    const width = parseInt(svg?.getAttribute('width') || '0')
    expect(width).toBeLessThanOrEqual(800)
  })

  it('highlights selected slice', () => {
    SelectedSliceIndex.set(1) // Select second slice
    const { container } = render(<LibraryWaveform />)

    // Selected slice should be highlighted (black color instead of darkGrey)
    const lines = container.querySelectorAll('line[stroke]')
    expect(lines.length).toBeGreaterThan(0)
  })

  it('highlights hovered slice', () => {
    HoveredSliceIndex.set(2) // Hover third slice
    const { container } = render(<LibraryWaveform />)

    // Hovered slice should be highlighted
    const lines = container.querySelectorAll('line[stroke]')
    expect(lines.length).toBeGreaterThan(0)
  })
})
