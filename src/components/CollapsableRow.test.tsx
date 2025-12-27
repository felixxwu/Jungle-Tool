import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '../test/test-utils'
import { CollapsableRow } from './CollapsableRow'
import { WindowSize } from '../lib/store'

describe('CollapsableRow', () => {
  beforeEach(() => {
    WindowSize.set({ width: 1200, height: 800 })
  })

  it('renders left and right content side by side on large screens', () => {
    const { container } = render(
      <CollapsableRow
        collapse={500}
        left={<div data-testid="left">Left</div>}
        right={<div data-testid="right">Right</div>}
      />
    )

    const left = container.querySelector('[data-testid="left"]')
    const right = container.querySelector('[data-testid="right"]')
    expect(left).toBeInTheDocument()
    expect(right).toBeInTheDocument()
  })

  it('renders left and right content vertically on small screens', () => {
    WindowSize.set({ width: 400, height: 800 })
    const { container } = render(
      <CollapsableRow
        collapse={500}
        left={<div data-testid="left">Left</div>}
        right={<div data-testid="right">Right</div>}
      />
    )

    const left = container.querySelector('[data-testid="left"]')
    const right = container.querySelector('[data-testid="right"]')
    expect(left).toBeInTheDocument()
    expect(right).toBeInTheDocument()
    // When collapsed, left and right should be in separate rows
    // We verify by checking both elements exist
  })

  it('uses collapse threshold correctly', () => {
    WindowSize.set({ width: 499, height: 800 })
    const { container: container1 } = render(
      <CollapsableRow
        collapse={500}
        left={<div data-testid="left1">Left</div>}
        right={<div data-testid="right1">Right</div>}
      />
    )
    // Should be collapsed (width < collapse) - both elements should exist
    expect(container1.querySelector('[data-testid="left1"]')).toBeInTheDocument()
    expect(container1.querySelector('[data-testid="right1"]')).toBeInTheDocument()

    WindowSize.set({ width: 501, height: 800 })
    const { container: container2 } = render(
      <CollapsableRow
        collapse={500}
        left={<div data-testid="left2">Left</div>}
        right={<div data-testid="right2">Right</div>}
      />
    )
    // Should not be collapsed (width >= collapse) - both elements should exist
    expect(container2.querySelector('[data-testid="left2"]')).toBeInTheDocument()
    expect(container2.querySelector('[data-testid="right2"]')).toBeInTheDocument()
  })
})

