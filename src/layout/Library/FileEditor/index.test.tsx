import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act } from '../../../test/test-utils'
import { FileEditor } from './index'
import { SelectedFileIndex, LoadedFiles, WindowSize } from '../../../lib/store'

// Mock child components
vi.mock('./LibraryWaveform', () => ({
  LibraryWaveform: () => <div data-testid='waveform'>LibraryWaveform</div>,
}))

vi.mock('./TrimEditor', () => ({
  TrimEditor: () => <div data-testid='trim-editor'>TrimEditor</div>,
}))

vi.mock('./SliceEditor', () => ({
  SliceEditor: () => <div data-testid='slice-editor'>SliceEditor</div>,
}))

describe('FileEditor', () => {
  const mockFile = {
    name: 'test-file',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(1000), new Float32Array(1000)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Start' as const, stepNum: 0 },
      { start: 500, type: 'Kick' as const, stepNum: 0 },
      { start: 999, type: 'End' as const, stepNum: 0 },
    ],
    whosampledLink: '',
    whosampledCount: 0,
  }

  beforeEach(() => {
    WindowSize.set({ width: 1200, height: 800 })
    LoadedFiles.set([mockFile])
    SelectedFileIndex.set(0)
  })

  it('renders nothing when no file is selected', () => {
    SelectedFileIndex.set(null)
    const { container } = render(<FileEditor />)
    expect(container.firstChild).toBeNull()
  })

  it('renders LibraryWaveform', () => {
    const { getByTestId } = render(<FileEditor />)
    expect(getByTestId('waveform')).toBeInTheDocument()
  })

  it('renders TrimEditor when file has Start/End slices', () => {
    const { getByTestId, queryByTestId } = render(<FileEditor />)
    expect(getByTestId('trim-editor')).toBeInTheDocument()
    expect(queryByTestId('slice-editor')).not.toBeInTheDocument()
  })

  it('renders SliceEditor when file does not have Start/End slices', () => {
    const fileWithoutTrim = {
      ...mockFile,
      slices: [
        { start: 0, type: 'Kick' as const, stepNum: 0 },
        { start: 500, type: 'Snare' as const, stepNum: 4 },
      ],
    }
    LoadedFiles.set([fileWithoutTrim])
    SelectedFileIndex.set(0)

    const { getByTestId, queryByTestId } = render(<FileEditor />)
    expect(getByTestId('slice-editor')).toBeInTheDocument()
    expect(queryByTestId('trim-editor')).not.toBeInTheDocument()
  })

  it('shows back button on small screens', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    const { getByText } = render(<FileEditor />)
    expect(getByText('‹ Back')).toBeInTheDocument()
  })

  it('hides back button on large screens', () => {
    WindowSize.set({ width: 1200, height: 800 }) // Large screen
    const { queryByText } = render(<FileEditor />)
    expect(queryByText('‹ Back')).not.toBeInTheDocument()
  })

  it('clears selected file when back button is clicked', async () => {
    WindowSize.set({ width: 500, height: 800 })
    const { getByText } = render(<FileEditor />)
    const backButton = getByText('‹ Back')

    await act(async () => {
      backButton.click()
    })

    expect(SelectedFileIndex.ref()).toBe(null)
  })
})
