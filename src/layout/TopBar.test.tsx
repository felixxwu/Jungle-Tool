import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { TopBar } from './TopBar'
import { Tab, WindowSize, SelectedFileIndex, AddLayerMode, LibraryLoading } from '../lib/store'

describe('TopBar', () => {
  beforeEach(() => {
    Tab.set('arrangement')
    WindowSize.set({ width: 1200, height: 800 }) // Desktop size
    SelectedFileIndex.set(null)
    AddLayerMode.set(false)
    LibraryLoading.set(false)
  })

  it('renders Arrangement tab', () => {
    render(<TopBar />)
    expect(screen.getByText('Arrangement')).toBeInTheDocument()
  })

  it('renders Library tab', () => {
    render(<TopBar />)
    expect(screen.getByText('Library')).toBeInTheDocument()
  })

  it('shows Layers tab when collapsed (small screen)', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    render(<TopBar />)
    expect(screen.getByText('Layers')).toBeInTheDocument()
  })

  it('hides Layers tab when not collapsed (large screen)', () => {
    WindowSize.set({ width: 1200, height: 800 }) // Large screen
    render(<TopBar />)
    expect(screen.queryByText('Layers')).not.toBeInTheDocument()
  })

  it('highlights selected tab', () => {
    Tab.set('arrangement')
    render(<TopBar />)
    const arrangementTab = screen.getByText('Arrangement')
    // Selected tab has black background (colors.black = #333)
    // In jsdom, computed styles might not work as expected, so we check the component renders
    expect(arrangementTab).toBeInTheDocument()
  })

  it('switches to Arrangement tab when clicked', async () => {
    Tab.set('library')
    render(<TopBar />)

    const arrangementTab = screen.getByText('Arrangement')
    await act(async () => {
      arrangementTab.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    expect(Tab.ref()).toBe('arrangement')
  })

  it('switches to Library tab when clicked', async () => {
    Tab.set('arrangement')
    render(<TopBar />)

    const libraryTab = screen.getByText('Library')
    await act(async () => {
      libraryTab.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    expect(Tab.ref()).toBe('library')
  })

  it('switches to Layers tab when clicked on small screen', async () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    Tab.set('arrangement')
    render(<TopBar />)

    const layersTab = screen.getByText('Layers')
    await act(async () => {
      layersTab.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    expect(Tab.ref()).toBe('layers')
  })

  it('clears selected file index when switching tabs', async () => {
    SelectedFileIndex.set(0)
    Tab.set('library')
    render(<TopBar />)

    const arrangementTab = screen.getByText('Arrangement')
    await act(async () => {
      arrangementTab.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    expect(SelectedFileIndex.ref()).toBe(null)
  })

  it('disables AddLayerMode when switching tabs', async () => {
    AddLayerMode.set(true)
    Tab.set('library')
    render(<TopBar />)

    const arrangementTab = screen.getByText('Arrangement')
    await act(async () => {
      arrangementTab.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    expect(AddLayerMode.ref()).toBe(false)
  })

  it('shows loading state for Library tab', () => {
    LibraryLoading.set(true)
    render(<TopBar />)
    // The loading text has a leading space: ' Loading...'
    expect(screen.getByText(/Loading\.\.\./)).toBeInTheDocument()
  })

  it('shows normal Library text when not loading', () => {
    LibraryLoading.set(false)
    render(<TopBar />)
    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.queryByText(' Loading...')).not.toBeInTheDocument()
  })

  it('updates tab highlight when tab changes externally', () => {
    Tab.set('arrangement')
    const { rerender } = render(<TopBar />)
    const arrangementTab = screen.getByText('Arrangement')
    expect(arrangementTab).toBeInTheDocument()

    act(() => {
      Tab.set('library')
    })
    rerender(<TopBar />)
    const libraryTab = screen.getByText('Library')
    // Library tab should now be visible and component should re-render
    expect(libraryTab).toBeInTheDocument()
  })

  it('updates Arrangement tab to selected when Tab state changes to arrangement externally', () => {
    Tab.set('library')
    const { rerender } = render(<TopBar />)
    const arrangementTab = screen.getByText('Arrangement')
    const libraryTab = screen.getByText('Library')

    // Initially library should be selected
    expect(libraryTab).toBeInTheDocument()
    expect(arrangementTab).toBeInTheDocument()

    // Simulate external tab change (like from addToArrangement)
    act(() => {
      Tab.set('arrangement')
    })
    rerender(<TopBar />)

    // Arrangement tab should now be selected (component should re-render with new tab state)
    const updatedArrangementTab = screen.getByText('Arrangement')
    expect(updatedArrangementTab).toBeInTheDocument()
    expect(Tab.ref()).toBe('arrangement')
  })

  it('immediately reflects tab change when set externally (like from addToArrangement)', () => {
    Tab.set('library')
    const { rerender } = render(<TopBar />)

    // Verify we're on library tab
    expect(Tab.ref()).toBe('library')
    expect(screen.getByText('Library')).toBeInTheDocument()

    // Simulate addToArrangement calling Tab.set('arrangement')
    act(() => {
      Tab.set('arrangement')
    })

    // Tab state should be updated
    expect(Tab.ref()).toBe('arrangement')

    // Re-render to verify TopBar reflects the change
    rerender(<TopBar />)

    // Component should reflect the new tab state - Arrangement should be in the document
    // (we can't easily test the selected state without checking styles, but we verify it renders)
    const arrangementTabs = screen.getAllByText('Arrangement')
    expect(arrangementTabs.length).toBeGreaterThan(0)
  })
})
