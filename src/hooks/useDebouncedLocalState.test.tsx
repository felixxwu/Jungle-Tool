import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '../test/test-utils'
import { useDebouncedLocalState } from './useDebouncedLocalState'

describe('useDebouncedLocalState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with provided value', () => {
    const onChange = vi.fn()
    let currentValue: string
    const TestComponent = () => {
      const [value] = useDebouncedLocalState('initial', onChange, 100)
      currentValue = value
      return null
    }
    render(<TestComponent />)
    expect(currentValue!).toBe('initial')
  })

  it('updates local value immediately', () => {
    const onChange = vi.fn()
    let currentValue: string
    let setValue: (val: string) => void
    const TestComponent = () => {
      const [value, setLocalValue] = useDebouncedLocalState('initial', onChange, 100)
      setValue = setLocalValue as (val: string) => void
      currentValue = value
      return <div data-testid='value'>{value}</div>
    }
    const { getByTestId } = render(<TestComponent />)

    act(() => {
      setValue!('updated')
    })

    // Check the rendered value which will be updated after re-render
    expect(getByTestId('value').textContent).toBe('updated')
    expect(currentValue!).toBe('updated')
  })

  it('debounces onChange callback', async () => {
    const onChange = vi.fn()
    let setValue: (val: string) => void
    const TestComponent = () => {
      const [, setLocalValue] = useDebouncedLocalState('initial', onChange, 100)
      setValue = setLocalValue as (val: string) => void
      return null
    }
    render(<TestComponent />)

    act(() => {
      setValue!('updated')
    })

    // onChange should not be called immediately
    expect(onChange).not.toHaveBeenCalled()

    // Advance timers to complete debounce
    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(onChange).toHaveBeenCalledWith('updated')
  })

  it('uses custom delay', async () => {
    const onChange = vi.fn()
    let setValue: (val: string) => void
    const TestComponent = () => {
      const [, setLocalValue] = useDebouncedLocalState('initial', onChange, 200)
      setValue = setLocalValue as (val: string) => void
      return null
    }
    render(<TestComponent />)

    act(() => {
      setValue!('updated')
    })

    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    expect(onChange).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    expect(onChange).toHaveBeenCalledWith('updated')
  })

  it('syncs local value when parent value changes', () => {
    const onChange = vi.fn()
    let currentValue: string
    const TestComponent = ({ value }: { value: string }) => {
      const [localValue] = useDebouncedLocalState(value, onChange, 100)
      currentValue = localValue
      return null
    }
    const { rerender } = render(<TestComponent value='initial' />)
    expect(currentValue!).toBe('initial')

    rerender(<TestComponent value='new-value' />)
    expect(currentValue!).toBe('new-value')
  })

  it('handles multiple rapid updates with debouncing', async () => {
    const onChange = vi.fn()
    let setValue: (val: string) => void
    const TestComponent = () => {
      const [, setLocalValue] = useDebouncedLocalState('initial', onChange, 100)
      setValue = setLocalValue as (val: string) => void
      return null
    }
    render(<TestComponent />)

    act(() => {
      setValue!('update1')
      setValue!('update2')
      setValue!('update3')
    })

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    // Should only call onChange with the last value
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('update3')
  })

  it('handles number values', async () => {
    const onChange = vi.fn()
    let setValue: (val: number) => void
    let currentValue: number
    const TestComponent = () => {
      const [value, setLocalValue] = useDebouncedLocalState(0, onChange, 100)
      setValue = setLocalValue as (val: number) => void
      currentValue = value
      return <div data-testid='value'>{value}</div>
    }
    const { getByTestId } = render(<TestComponent />)

    act(() => {
      setValue!(42)
    })

    // Check the rendered value which will be updated after re-render
    expect(getByTestId('value').textContent).toBe('42')
    expect(currentValue!).toBe(42)

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(onChange).toHaveBeenCalledWith(42)
  })

  it('handles object values with deep equality', () => {
    const onChange = vi.fn()
    let currentValue: { a: number; b: string }
    const TestComponent = ({ value }: { value: { a: number; b: string } }) => {
      const [localValue] = useDebouncedLocalState(value, onChange, 100)
      currentValue = localValue
      return null
    }
    const { rerender } = render(<TestComponent value={{ a: 1, b: 'test' }} />)
    expect(currentValue!).toEqual({ a: 1, b: 'test' })

    // Same object with different reference but same content should sync
    rerender(<TestComponent value={{ a: 1, b: 'test' }} />)
    expect(currentValue!).toEqual({ a: 1, b: 'test' })

    // Different content should sync
    rerender(<TestComponent value={{ a: 2, b: 'test' }} />)
    expect(currentValue!).toEqual({ a: 2, b: 'test' })
  })

  it('handles array values with deep equality', () => {
    const onChange = vi.fn()
    let currentValue: number[]
    const TestComponent = ({ value }: { value: number[] }) => {
      const [localValue] = useDebouncedLocalState(value, onChange, 100)
      currentValue = localValue
      return null
    }
    const { rerender } = render(<TestComponent value={[1, 2, 3]} />)
    expect(currentValue!).toEqual([1, 2, 3])

    // Same array with different reference but same content should sync
    rerender(<TestComponent value={[1, 2, 3]} />)
    expect(currentValue!).toEqual([1, 2, 3])

    // Different content should sync
    rerender(<TestComponent value={[1, 2, 4]} />)
    expect(currentValue!).toEqual([1, 2, 4])
  })
})
