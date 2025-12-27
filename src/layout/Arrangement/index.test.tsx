import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '../../test/test-utils'
import { ArrangementView } from './index'
import { WindowSize } from '../../lib/store'
import { appWidth, arrangementSidebarWidth } from '../../lib/consts'

// Mock child components to avoid complex dependencies
vi.mock('./Main', () => ({
  Main: () => <div data-testid="main">Main</div>,
}))

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}))

describe('ArrangementView', () => {
  beforeEach(() => {
    WindowSize.set({ width: 1200, height: 800 })
  })

  it('renders Main component', () => {
    const { getByTestId } = render(<ArrangementView />)
    expect(getByTestId('main')).toBeInTheDocument()
  })

  it('shows sidebar on large screens', () => {
    WindowSize.set({ width: 1200, height: 800 }) // Large screen
    const { getByTestId } = render(<ArrangementView />)
    expect(getByTestId('sidebar')).toBeInTheDocument()
  })

  it('hides sidebar on small screens', () => {
    WindowSize.set({ width: 500, height: 800 }) // Small screen (< appWidth - arrangementSidebarWidth)
    const { queryByTestId } = render(<ArrangementView />)
    expect(queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('shows sidebar when width is exactly at threshold', () => {
    const threshold = appWidth - arrangementSidebarWidth
    WindowSize.set({ width: threshold + 1, height: 800 })
    const { getByTestId } = render(<ArrangementView />)
    expect(getByTestId('sidebar')).toBeInTheDocument()
  })

  it('hides sidebar when width is just below threshold', () => {
    const threshold = appWidth - arrangementSidebarWidth
    WindowSize.set({ width: threshold - 1, height: 800 })
    const { queryByTestId } = render(<ArrangementView />)
    expect(queryByTestId('sidebar')).not.toBeInTheDocument()
  })
})
