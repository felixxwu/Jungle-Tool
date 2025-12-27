import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { TrimEditor } from './TrimEditor'
import { LoadedFiles, SelectedFileIndex, EditSliceMode, AutoSliceMode } from '../../../lib/store'
import { autoSlice } from '../../../actions/autoSlice'
import { stopPlayback } from '../../../lib/playback'
import { stereoSlice } from '../../../lib/audio'

// Mock dependencies
vi.mock('../../../actions/autoSlice', () => ({
  autoSlice: vi.fn(),
}))

vi.mock('../../../lib/playback', () => ({
  stopPlayback: vi.fn(),
}))

vi.mock('../../../lib/audio', () => ({
  stereoSlice: vi.fn((samples: [Float32Array, Float32Array], start: number, end: number) => {
    const left = samples[0].slice(start, end)
    const right = samples[1].slice(start, end)
    return [left, right] as [Float32Array, Float32Array]
  }),
}))

describe('TrimEditor', () => {
  const mockSamples = [new Float32Array(44100), new Float32Array(44100)] as [
    Float32Array,
    Float32Array
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([])
    SelectedFileIndex.set(null)
    EditSliceMode.set(false)
    AutoSliceMode.set(false)
  })

  it('renders trim instructions', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [
          { start: 1000, type: 'Start', stepNum: 0 },
          { start: 40000, type: 'End', stepNum: 0 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    expect(screen.getByText('Adjust start and end to create a seamless loop')).toBeInTheDocument()
  })

  it('displays Start and End slices for editing', () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [
          { start: 1000, type: 'Start', stepNum: 0 },
          { start: 40000, type: 'End', stepNum: 0 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    // Should display Start and End slice types
    expect(screen.getByText('Start')).toBeInTheDocument()
    expect(screen.getByText('End')).toBeInTheDocument()
  })

  it('trims file using Start and End slice positions', async () => {
    const startSlice = 1000
    const endSlice = 40000

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [
          { start: startSlice, type: 'Start', stepNum: 0 },
          { start: endSlice, type: 'End', stepNum: 0 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    const trimButton = screen.getByText('Trim and continue ›')
    await act(async () => {
      trimButton.click()
    })

    // Verify stereoSlice was called with correct start and end
    expect(stereoSlice).toHaveBeenCalledWith(mockSamples, startSlice, endSlice)

    // Verify samples were updated
    const file = LoadedFiles.ref()[0]
    expect(file.samples[0].length).toBe(endSlice - startSlice)
    expect(file.samples[1].length).toBe(endSlice - startSlice)
  })

  it('uses default start position (0) when Start slice is missing', async () => {
    const endSlice = 40000

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [{ start: endSlice, type: 'End', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    const trimButton = screen.getByText('Trim and continue ›')
    await act(async () => {
      trimButton.click()
    })

    expect(stereoSlice).toHaveBeenCalledWith(mockSamples, 0, endSlice)
  })

  it('uses file length as end when End slice is missing', async () => {
    const startSlice = 1000
    const fileLength = mockSamples[0].length

    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [{ start: startSlice, type: 'Start', stepNum: 0 }],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    const trimButton = screen.getByText('Trim and continue ›')
    await act(async () => {
      trimButton.click()
    })

    expect(stereoSlice).toHaveBeenCalledWith(mockSamples, startSlice, fileLength)
  })

  it('clears slices after trimming', async () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [
          { start: 1000, type: 'Start', stepNum: 0 },
          { start: 40000, type: 'End', stepNum: 0 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    const trimButton = screen.getByText('Trim and continue ›')
    await act(async () => {
      trimButton.click()
    })

    const file = LoadedFiles.ref()[0]
    expect(file.slices.length).toBe(0)
  })

  it('stops playback after trimming', async () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [
          { start: 1000, type: 'Start', stepNum: 0 },
          { start: 40000, type: 'End', stepNum: 0 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    const trimButton = screen.getByText('Trim and continue ›')
    await act(async () => {
      trimButton.click()
    })

    expect(stopPlayback).toHaveBeenCalledTimes(1)
  })

  it('enables edit slice mode and auto slice mode after trimming', async () => {
    LoadedFiles.set([
      {
        name: 'Test Break',
        artist: 'Test Artist',
        year: 2020,
        samples: mockSamples,
        slices: [
          { start: 1000, type: 'Start', stepNum: 0 },
          { start: 40000, type: 'End', stepNum: 0 },
        ],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    SelectedFileIndex.set(0)

    render(<TrimEditor />)

    const trimButton = screen.getByText('Trim and continue ›')
    await act(async () => {
      trimButton.click()
    })

    expect(EditSliceMode.ref()).toBe(true)
    expect(AutoSliceMode.ref()).toBe(true)
    expect(autoSlice).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when no file is selected', () => {
    SelectedFileIndex.set(null)
    const { container } = render(<TrimEditor />)

    expect(container.firstChild).toBeNull()
  })
})
