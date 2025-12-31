import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act } from '../../test/test-utils'
import { Library } from './index'
import { SelectedFileIndex, WindowSize } from '../../lib/store'
import { appWidth } from '../../lib/consts'

// Mock child components
vi.mock('./FileList', () => ({
  FileList: () => <div data-testid="file-list">FileList</div>,
}))

vi.mock('./FileEditor', () => ({
  FileEditor: () => <div data-testid="file-editor">FileEditor</div>,
}))

describe('Library', () => {
  beforeEach(() => {
    WindowSize.set({ width: 1200, height: 800 })
    SelectedFileIndex.set(null)
  })

  it('renders FileList and FileEditor side by side on large screens', () => {
    WindowSize.set({ width: 1200, height: 800 }) // Large screen
    const { getByTestId } = render(<Library />)
    expect(getByTestId('file-list')).toBeInTheDocument()
    expect(getByTestId('file-editor')).toBeInTheDocument()
  })

  it('shows only FileList when no file is selected on small screens', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    SelectedFileIndex.set(null)
    const { getByTestId, queryByTestId } = render(<Library />)
    expect(getByTestId('file-list')).toBeInTheDocument()
    expect(queryByTestId('file-editor')).not.toBeInTheDocument()
  })

  it('shows only FileEditor when file is selected on small screens', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    SelectedFileIndex.set(0)
    const { getByTestId, queryByTestId } = render(<Library />)
    expect(queryByTestId('file-list')).not.toBeInTheDocument()
    expect(getByTestId('file-editor')).toBeInTheDocument()
  })

  it('switches between FileList and FileEditor when file selection changes on small screens', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    SelectedFileIndex.set(null)
    const { rerender, getByTestId, queryByTestId } = render(<Library />)

    // Initially shows FileList
    expect(getByTestId('file-list')).toBeInTheDocument()
    expect(queryByTestId('file-editor')).not.toBeInTheDocument()

    // Select a file
    act(() => {
      SelectedFileIndex.set(0)
    })
    rerender(<Library />)

    // Now shows FileEditor
    expect(queryByTestId('file-list')).not.toBeInTheDocument()
    expect(getByTestId('file-editor')).toBeInTheDocument()
  })

  it('uses mobile mode when width is below appWidth threshold', () => {
    // Test at threshold (mobile mode)
    WindowSize.set({ width: appWidth - 1, height: 800 })
    SelectedFileIndex.set(null)
    const { getByTestId, queryByTestId } = render(<Library />)
    // Should be in mobile mode
    expect(getByTestId('file-list')).toBeInTheDocument()
    expect(queryByTestId('file-editor')).not.toBeInTheDocument()
  })

  it('uses desktop mode when width is above appWidth threshold', () => {
    // Test above threshold (desktop mode)
    WindowSize.set({ width: appWidth + 1, height: 800 })
    SelectedFileIndex.set(null)
    const { getByTestId } = render(<Library />)
    // Should be in desktop mode
    expect(getByTestId('file-list')).toBeInTheDocument()
    expect(getByTestId('file-editor')).toBeInTheDocument()
  })
})
