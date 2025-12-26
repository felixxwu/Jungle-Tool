import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/test-utils'
import { Text } from './Text'

describe('Text', () => {
  it('renders text content', () => {
    render(<Text>Hello World</Text>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('applies big prop correctly', () => {
    render(<Text big>Big Text</Text>)
    expect(screen.getByText('Big Text')).toBeInTheDocument()
  })

  it('handles onClick events', () => {
    const handleClick = vi.fn()
    render(<Text onClick={handleClick}>Clickable</Text>)
    const text = screen.getByText('Clickable')
    text.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(
      <Text onClick={handleClick} disabled>
        Disabled
      </Text>
    )
    const text = screen.getByText('Disabled')
    text.click()
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders with selected state', () => {
    render(<Text selected>Selected Text</Text>)
    expect(screen.getByText('Selected Text')).toBeInTheDocument()
  })
})
