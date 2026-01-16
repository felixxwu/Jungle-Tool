import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act } from '../../../test/test-utils'
import { Sidebar } from './index'
import { Tab, WindowSize, ShortenNotes } from '../../../lib/store'
import { appWidth, arrangementSidebarWidth } from '../../../lib/consts'

// Mock child components
vi.mock('./LayerControls', () => ({
  LayerControls: () => <div data-testid='layer-controls'>LayerControls</div>,
}))

vi.mock('./BPMSlider', () => ({
  BPMSlider: () => <div data-testid='bpm-slider'>BPMSlider</div>,
}))

vi.mock('./SwingSlider', () => ({
  SwingSlider: () => <div data-testid='swing-slider'>SwingSlider</div>,
}))

vi.mock('./SaturationSlider', () => ({
  SaturationSlider: () => <div data-testid='saturation-slider'>SaturationSlider</div>,
}))

vi.mock('./NoteLengthSlider', () => ({
  NoteLengthSlider: () => <div data-testid='note-length-slider'>NoteLengthSlider</div>,
}))

vi.mock('./FadeOutSlider', () => ({
  FadeOutSlider: () => <div data-testid='fade-out-slider'>FadeOutSlider</div>,
}))

vi.mock('../Main/BottomBar', () => ({
  BottomBar: () => <div data-testid='bottom-bar'>BottomBar</div>,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    WindowSize.set({ width: 1200, height: 800 })
    Tab.set('arrangement')
    ShortenNotes.set(true) // Enable ShortenNotes so NoteLengthSlider and FadeOutSlider are rendered
  })

  it('renders all control sliders', () => {
    const { getByTestId } = render(<Sidebar />)
    expect(getByTestId('layer-controls')).toBeInTheDocument()
    expect(getByTestId('bpm-slider')).toBeInTheDocument()
    expect(getByTestId('swing-slider')).toBeInTheDocument()
    expect(getByTestId('saturation-slider')).toBeInTheDocument()
    expect(getByTestId('note-length-slider')).toBeInTheDocument()
    expect(getByTestId('fade-out-slider')).toBeInTheDocument()
  })

  it('shows BottomBar when collapsed (small screen)', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    const { getByTestId } = render(<Sidebar />)
    expect(getByTestId('bottom-bar')).toBeInTheDocument()
  })

  it('hides BottomBar when not collapsed (large screen)', () => {
    WindowSize.set({ width: 1200, height: 800 }) // Large screen
    const { queryByTestId } = render(<Sidebar />)
    expect(queryByTestId('bottom-bar')).not.toBeInTheDocument()
  })

  it('switches to arrangement tab when layers tab is active on large screen', () => {
    WindowSize.set({ width: 1200, height: 800 }) // Large screen
    Tab.set('layers')
    render(<Sidebar />)
    // Should automatically switch to arrangement
    expect(Tab.ref()).toBe('arrangement')
  })

  it('does not switch tabs when collapsed (small screen)', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    Tab.set('layers')
    render(<Sidebar />)
    // Should not switch tabs when collapsed
    expect(Tab.ref()).toBe('layers')
  })

  it('applies full width style when collapsed', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen
    const { container } = render(<Sidebar />)
    const sidebar = container.firstChild as HTMLElement
    expect(sidebar.style.width).toBe('100vw')
  })

  it('uses threshold based on appWidth and arrangementSidebarWidth', () => {
    const threshold = appWidth - arrangementSidebarWidth

    // Just below threshold - should be collapsed
    WindowSize.set({ width: threshold - 1, height: 800 })
    const { container: container1 } = render(<Sidebar />)
    expect((container1.firstChild as HTMLElement).style.width).toBe('100vw')

    // Just above threshold - should not be collapsed
    act(() => {
      WindowSize.set({ width: threshold + 1, height: 800 })
    })
    const { container: container2 } = render(<Sidebar />)
    expect((container2.firstChild as HTMLElement).style.width).toBe('')
  })
})
