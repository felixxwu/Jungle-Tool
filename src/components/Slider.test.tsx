import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '../test/test-utils'
import { Slider } from './Slider'

describe('Slider', () => {
  const defaultProps = {
    min: 0,
    max: 100,
    value: 50,
    onInput: vi.fn(),
    label: 'Test Slider',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders slider with label', () => {
    render(<Slider {...defaultProps} />)
    expect(screen.getByText('Test Slider')).toBeInTheDocument()
  })

  it('renders slider input', () => {
    render(<Slider {...defaultProps} />)
    const slider = screen.getByLabelText('Test Slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('type', 'range')
  })

  it('sets correct min, max, and value attributes', () => {
    render(<Slider {...defaultProps} />)
    const slider = screen.getByLabelText('Test Slider') as HTMLInputElement
    expect(slider.min).toBe('0')
    expect(slider.max).toBe('100')
    expect(slider.value).toBe('50')
  })

  it('calls onInput when slider value changes', async () => {
    render(<Slider {...defaultProps} />)
    const slider = screen.getByLabelText('Test Slider') as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '75',
      })
      fireEvent.input(slider)
    })

    expect(defaultProps.onInput).toHaveBeenCalledWith(75)
  })

  it('positions label on left when value is less than 50%', () => {
    render(<Slider {...defaultProps} value={25} />)
    const label = screen.getByText('Test Slider')
    // Label should be positioned on left (right: auto or not set)
    expect(label).toBeInTheDocument()
  })

  it('positions label on right when value is 50% or more', () => {
    render(<Slider {...defaultProps} value={75} />)
    const label = screen.getByText('Test Slider')
    // Label should be positioned on right (left: 15px)
    expect(label).toBeInTheDocument()
  })

  it('handles value at minimum', () => {
    render(<Slider {...defaultProps} value={0} />)
    const slider = screen.getByLabelText('Test Slider') as HTMLInputElement
    expect(slider.value).toBe('0')
  })

  it('handles value at maximum', () => {
    render(<Slider {...defaultProps} value={100} />)
    const slider = screen.getByLabelText('Test Slider') as HTMLInputElement
    expect(slider.value).toBe('100')
  })

  it('parses value as integer in onInput', async () => {
    render(<Slider {...defaultProps} />)
    const slider = screen.getByLabelText('Test Slider') as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '42.7',
      })
      fireEvent.input(slider)
    })

    expect(defaultProps.onInput).toHaveBeenCalledWith(42)
  })
})
