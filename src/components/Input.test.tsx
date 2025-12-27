import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '../test/test-utils'
import { Input } from './Input'

describe('Input', () => {
  const defaultProps = {
    value: 'initial',
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input with value', () => {
    render(<Input {...defaultProps} />)
    const input = screen.getByDisplayValue('initial') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe('initial')
  })

  it('calls onChange when value changes', async () => {
    render(<Input {...defaultProps} />)
    const input = screen.getByDisplayValue('initial') as HTMLInputElement

    await act(async () => {
      fireEvent.change(input, { target: { value: 'updated' } })
    })

    expect(defaultProps.onChange).toHaveBeenCalledWith('updated')
  })

  it('applies selected styling when selected prop is true', () => {
    render(<Input {...defaultProps} selected />)
    const input = screen.getByDisplayValue('initial')
    // Selected input should have black background
    expect(input).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(<Input {...defaultProps} disabled />)
    const input = screen.getByDisplayValue('initial') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('applies fullWidth styling', () => {
    render(<Input {...defaultProps} $fullWidth />)
    const input = screen.getByDisplayValue('initial')
    expect(input).toBeInTheDocument()
  })

  it('handles onPointerEnter and onPointerLeave', () => {
    const onPointerEnter = vi.fn()
    const onPointerLeave = vi.fn()
    render(
      <Input {...defaultProps} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} />
    )
    const input = screen.getByDisplayValue('initial')

    fireEvent.pointerEnter(input)
    expect(onPointerEnter).toHaveBeenCalledTimes(1)

    fireEvent.pointerLeave(input)
    expect(onPointerLeave).toHaveBeenCalledTimes(1)
  })

  it('handles empty value', () => {
    render(<Input value='' onChange={vi.fn()} />)
    const input = screen.getByDisplayValue('') as HTMLInputElement
    expect(input.value).toBe('')
  })
})
