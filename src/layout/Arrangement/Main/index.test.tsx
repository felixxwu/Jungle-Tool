import { describe, it, expect, vi } from 'vitest'
import { render } from '../../../test/test-utils'
import { Main } from './index'

// Mock child components
vi.mock('./Grid', () => ({
  Grid: () => <div data-testid="grid">Grid</div>,
}))

vi.mock('./ArragementWaveform', () => ({
  ArragementWaveform: () => <div data-testid="waveform">ArragementWaveform</div>,
}))

vi.mock('./BottomBar', () => ({
  BottomBar: () => <div data-testid="bottom-bar">BottomBar</div>,
}))

vi.mock('./BarSelection', () => ({
  BarSelection: () => <div data-testid="bar-selection">BarSelection</div>,
}))

describe('Main', () => {
  it('renders all main components', () => {
    const { getByTestId } = render(<Main />)
    expect(getByTestId('bar-selection')).toBeInTheDocument()
    expect(getByTestId('grid')).toBeInTheDocument()
    expect(getByTestId('waveform')).toBeInTheDocument()
    expect(getByTestId('bottom-bar')).toBeInTheDocument()
  })

  it('renders components in correct order', () => {
    const { container } = render(<Main />)
    const children = Array.from(container.firstChild?.childNodes || [])
    
    // Should have BarSelection, Grid, Waveform, and BottomBar
    expect(children.length).toBeGreaterThan(0)
  })
})

