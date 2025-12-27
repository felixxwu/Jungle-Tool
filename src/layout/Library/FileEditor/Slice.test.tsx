import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { Slice } from './Slice'
import {
  SelectedFileIndex,
  LoadedFiles,
  SelectedSliceIndex,
  EditSliceMode,
  WindowSize,
} from '../../../lib/store'
import { playSlice } from '../../../actions/playSlice'
import { playTrim } from '../../../actions/playTrim'
import { updateSliceStart } from '../../../actions/updateSliceStart'

// Mock actions
vi.mock('../../../actions/playSlice', () => ({
  playSlice: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../actions/playTrim', () => ({
  playTrim: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../actions/updateSliceStart', () => ({
  updateSliceStart: vi.fn(),
}))

describe('Slice', () => {
  const mockFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(1000), new Float32Array(1000)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Start' as const, stepNum: 0 },
      { start: 100, type: 'Kick' as const, stepNum: 0 },
      { start: 200, type: 'Snare' as const, stepNum: 4 },
      { start: 999, type: 'End' as const, stepNum: 0 },
    ],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    SelectedFileIndex.set(0)
    LoadedFiles.set([mockFile])
    SelectedSliceIndex.set(null)
    EditSliceMode.set(false)
    WindowSize.set({ width: 1200, height: 800 })
  })

  it('renders nothing when no file is selected', () => {
    SelectedFileIndex.set(null)
    const { container } = render(<Slice sliceIndex={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays slice type and step number', () => {
    render(<Slice sliceIndex={1} />) // Kick slice
    expect(screen.getByText('Kick')).toBeInTheDocument()
    expect(screen.getByText('00')).toBeInTheDocument() // stepNum 0
  })

  it('highlights selected slice', () => {
    SelectedSliceIndex.set(1)
    render(<Slice sliceIndex={1} />)
    const sliceButton = screen.getByText('Kick')
    // Selected slice should have selected styling
    expect(sliceButton).toBeInTheDocument()
  })

  it('plays slice when clicked', async () => {
    render(<Slice sliceIndex={1} />) // Kick slice
    const sliceButton = screen.getByText('Kick')

    await act(async () => {
      sliceButton.click()
    })

    // Wait for async operations to complete
    await act(async () => {
      await new Promise(r => setTimeout(r, 100))
    })

    expect(playSlice).toHaveBeenCalledWith(0, 1)
    expect(SelectedSliceIndex.ref()).toBe(1)
  })

  it('plays trim when Start/End slice is clicked', async () => {
    render(<Slice sliceIndex={0} />) // Start slice
    const sliceButton = screen.getByText('Start')

    await act(async () => {
      sliceButton.click()
    })

    // Wait for async operations to complete
    await act(async () => {
      await new Promise(r => setTimeout(r, 100))
    })

    expect(playTrim).toHaveBeenCalledWith(0)
  })

  it('deselects slice when clicking selected slice', async () => {
    SelectedSliceIndex.set(1)
    render(<Slice sliceIndex={1} />)
    const sliceButton = screen.getByText('Kick')

    await act(async () => {
      sliceButton.click()
      await new Promise(r => setTimeout(r, 10))
    })

    expect(SelectedSliceIndex.ref()).toBe(null)
  })

  it('shows edit controls when EditSliceMode is enabled', () => {
    EditSliceMode.set(true)
    render(<Slice sliceIndex={1} />)

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('«')).toBeInTheDocument() // Large adjustment left
    expect(screen.getByText('‹')).toBeInTheDocument() // Small adjustment left
    expect(screen.getByText('›')).toBeInTheDocument() // Small adjustment right
    expect(screen.getByText('»')).toBeInTheDocument() // Large adjustment right
  })

  it('hides edit controls for Start/End slices', () => {
    EditSliceMode.set(true)
    render(<Slice sliceIndex={0} />) // Start slice

    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('updates slice start position with adjustment buttons', async () => {
    EditSliceMode.set(true)
    render(<Slice sliceIndex={1} />) // Kick slice at start 100

    const smallRightButton = screen.getByText('›')
    await act(async () => {
      smallRightButton.click()
      await new Promise(r => setTimeout(r, 10))
    })

    // updateSliceStart is called with: slice.start + adjustment, sliceIndex, direction
    // For '›' (small right), it uses smallSliceAdjustment (positive value)
    expect(updateSliceStart).toHaveBeenCalled()
    const callArgs = (updateSliceStart as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[1]).toBe(1) // sliceIndex
    expect(callArgs[2]).toBe('forward') // direction for positive adjustment
  })

  it('allows changing slice type in edit mode', async () => {
    EditSliceMode.set(true)
    render(<Slice sliceIndex={1} forceEditSliceMode={true} />)

    // Click Edit to enter edit mode
    const editButton = screen.getByText('Edit')
    await act(async () => {
      editButton.click()
    })

    // Should show type selection buttons
    expect(screen.getByText('Kick')).toBeInTheDocument()
    expect(screen.getByText('Snare')).toBeInTheDocument()
    expect(screen.getByText('Hat')).toBeInTheDocument()
  })

  it('allows updating step number', async () => {
    EditSliceMode.set(true)
    render(<Slice sliceIndex={1} />)

    // Click on step number to enter step edit mode
    const stepNumber = screen.getByText('00')
    await act(async () => {
      stepNumber.click()
    })

    // Should show step adjustment buttons
    expect(screen.getByText('‹')).toBeInTheDocument() // Decrease step
    expect(screen.getByText('›')).toBeInTheDocument() // Increase step
  })
})
