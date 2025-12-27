import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/test-utils'
import { Text } from './Text'

describe('Text', () => {
  it('renders text content', () => {
    render(<Text>Hello World</Text>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('applies big prop correctly', () => {
    const { container } = render(<Text big>Big Text</Text>)
    const textElement = screen.getByText('Big Text')
    expect(textElement).toBeInTheDocument()

    // Verify the big prop actually applies styling (height)
    const styledElement = container.querySelector('div')
    expect(styledElement).toHaveStyle({ height: '35px', minHeight: '35px' })
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
    const { container } = render(<Text selected>Selected Text</Text>)
    const textElement = screen.getByText('Selected Text')
    expect(textElement).toBeInTheDocument()

    // Verify the selected prop actually applies styling (background and text color)
    const styledElement = container.querySelector('div')
    expect(styledElement).toHaveStyle({
      backgroundColor: '#333', // colors.black
      color: '#f7f7f7', // colors.white
    })
  })
})
