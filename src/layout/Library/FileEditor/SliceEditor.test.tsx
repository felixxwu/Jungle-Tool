import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { SliceEditor } from './SliceEditor'
import {
  SelectedFileIndex,
  LoadedFiles,
  AutoSliceMode,
  EditSliceMode,
  Layers,
  Modal,
} from '../../../lib/store'
import { autoSlice } from '../../../actions/autoSlice'
import { addToArrangement } from '../../../actions/addToArrangement'
import { addSlice } from '../../../actions/addSlice'

// Mock dependencies
vi.mock('../../../actions/autoSlice', () => ({
  autoSlice: vi.fn(),
}))

vi.mock('../../../actions/addToArrangement', () => ({
  addToArrangement: vi.fn(),
}))

vi.mock('../../../actions/addSlice', () => ({
  addSlice: vi.fn(),
}))

vi.mock('./SensitivitySlider', () => ({
  SensitivitySlider: () => <div data-testid='sensitivity-slider'>SensitivitySlider</div>,
}))

vi.mock('./Slice', () => ({
  Slice: ({ sliceIndex }: { sliceIndex: number }) => (
    <div data-testid={`slice-${sliceIndex}`}>Slice {sliceIndex}</div>
  ),
}))

vi.mock('../../../modals/AutoSliceModal', () => ({
  AutoSliceModal: () => <div data-testid='auto-slice-modal'>AutoSliceModal</div>,
}))

vi.mock('../../../modals/DownloadFileModal', () => ({
  DownloadFileModal: () => <div data-testid='download-modal'>DownloadFileModal</div>,
}))

describe('SliceEditor', () => {
  const mockFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(1000), new Float32Array(1000)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Kick' as const, stepNum: 0 },
      { start: 100, type: 'Snare' as const, stepNum: 4 },
    ],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    SelectedFileIndex.set(0)
    LoadedFiles.set([mockFile])
    AutoSliceMode.set(false)
    EditSliceMode.set(false)
    Layers.set([])
    Modal.set(null)
  })

  it('renders nothing when no file is selected', () => {
    SelectedFileIndex.set(null)
    const { container } = render(<SliceEditor />)
    expect(container.firstChild).toBeNull()
  })

  it('shows "Add to arrangement" button when file is not already added', () => {
    Layers.set([])
    render(<SliceEditor />)
    expect(screen.getByText('Add to arrangement +')).toBeInTheDocument()
  })

  it('shows "Already added" when file is in layers', () => {
    Layers.set([{ filename: 'test-file', volume: 50, pitch: 0 }])
    render(<SliceEditor />)
    expect(screen.getByText('Already added')).toBeInTheDocument()
    expect(screen.queryByText('Add to arrangement +')).not.toBeInTheDocument()
  })

  it('calls addToArrangement when add button is clicked', async () => {
    render(<SliceEditor />)
    const addButton = screen.getByText('Add to arrangement +')

    await act(async () => {
      addButton.click()
      // Wait for async operations
      await new Promise(r => setTimeout(r, 10))
    })

    expect(addToArrangement).toHaveBeenCalledWith(0)
  })

  it('shows auto-slice button in edit mode', () => {
    EditSliceMode.set(true)
    render(<SliceEditor />)
    expect(screen.getByText('Auto-slice')).toBeInTheDocument()
  })

  it('shows edit button when not in edit mode', () => {
    EditSliceMode.set(false)
    render(<SliceEditor />)
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('triggers autoSlice directly when file has no slices', async () => {
    const fileWithoutSlices = {
      ...mockFile,
      slices: [],
    }
    LoadedFiles.set([fileWithoutSlices])
    EditSliceMode.set(true)

    render(<SliceEditor />)
    const autoSliceButton = screen.getByText('Auto-slice')

    await act(async () => {
      autoSliceButton.click()
    })

    expect(AutoSliceMode.ref()).toBe(true)
    expect(autoSlice).toHaveBeenCalledTimes(1)
    expect(Modal.ref()).toBe(null)
  })

  it('shows AutoSliceModal when file has existing slices', async () => {
    EditSliceMode.set(true)
    render(<SliceEditor />)
    const autoSliceButton = screen.getByText('Auto-slice')

    await act(async () => {
      autoSliceButton.click()
    })

    // Modal should be set (we can't easily test the component directly, but we can check state)
    const modal = Modal.ref()
    expect(modal).not.toBe(null)
  })

  it('shows SensitivitySlider in auto-slice mode', () => {
    AutoSliceMode.set(true)
    render(<SliceEditor />)
    expect(screen.getByTestId('sensitivity-slider')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('exits auto-slice mode when Done is clicked', async () => {
    AutoSliceMode.set(true)
    render(<SliceEditor />)
    const doneButton = screen.getByText('Done')

    await act(async () => {
      doneButton.click()
    })

    expect(AutoSliceMode.ref()).toBe(false)
  })

  it('renders all slices', () => {
    render(<SliceEditor />)
    expect(screen.getByTestId('slice-0')).toBeInTheDocument()
    expect(screen.getByTestId('slice-1')).toBeInTheDocument()
  })

  it('shows "Add Slice +" button in edit mode', () => {
    EditSliceMode.set(true)
    render(<SliceEditor />)
    expect(screen.getByText('Add Slice +')).toBeInTheDocument()
  })

  it('calls addSlice when Add Slice button is clicked', async () => {
    EditSliceMode.set(true)
    render(<SliceEditor />)
    const addSliceButton = screen.getByText('Add Slice +')

    await act(async () => {
      addSliceButton.click()
    })

    expect(addSlice).toHaveBeenCalledTimes(1)
  })

  it('shows whosampled link if available', () => {
    const fileWithLink = {
      ...mockFile,
      whosampledLink: 'https://example.com',
      slices: [
        { start: 0, type: 'Kick' as const, stepNum: 0 },
        { start: 100, type: 'Snare' as const, stepNum: 4 },
      ],
    }
    LoadedFiles.set([fileWithLink])
    render(<SliceEditor />)

    expect(screen.getByText(/test-file on Whosampled.com/)).toBeInTheDocument()
  })

  it('opens whosampled link in new window', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const fileWithLink = {
      ...mockFile,
      whosampledLink: 'https://example.com',
      slices: [
        { start: 0, type: 'Kick' as const, stepNum: 0 },
        { start: 100, type: 'Snare' as const, stepNum: 4 },
      ],
    }
    LoadedFiles.set([fileWithLink])
    render(<SliceEditor />)

    const link = screen.getByText(/test-file on Whosampled.com/)
    link.click()

    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank')
    openSpy.mockRestore()
  })
})
