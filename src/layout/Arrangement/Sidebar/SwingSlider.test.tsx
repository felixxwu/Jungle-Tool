import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { SwingSlider } from './SwingSlider'
import { Swing } from '../../../lib/store'

describe('SwingSlider', () => {
  beforeEach(() => {
    Swing.set(17) // Default swing
  })

  it('renders the swing slider', () => {
    render(<SwingSlider />)
    expect(screen.getByText(/Swing:/)).toBeInTheDocument()
  })

  it('displays the current swing percentage', () => {
    Swing.set(20)
    render(<SwingSlider />)
    expect(screen.getByText('Swing: 20%')).toBeInTheDocument()
  })

  it('updates swing value when slider is changed', async () => {
    render(<SwingSlider />)

    // Find the slider input
    const slider = screen.getByLabelText(/Swing:/) as HTMLInputElement

    await act(async () => {
      // Simulate changing the slider value
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '25',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce (SwingSlider uses useDebouncedLocalState with default 100ms delay)
    await act(async () => {
      await new Promise(r => setTimeout(r, 120))
    })

    // Swing value should be updated
    expect(Swing.ref()).toBe(25)
  })

  it('respects minimum swing value (0)', async () => {
    Swing.set(10)
    render(<SwingSlider />)

    const slider = screen.getByLabelText(/Swing:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '0',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 120))
    })

    expect(Swing.ref()).toBe(0)
  })

  it('respects maximum swing value (33)', async () => {
    Swing.set(30)
    render(<SwingSlider />)

    const slider = screen.getByLabelText(/Swing:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '33',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 120))
    })

    expect(Swing.ref()).toBe(33)
  })

  it('updates display when swing value changes externally', () => {
    Swing.set(15)
    const { rerender } = render(<SwingSlider />)
    expect(screen.getByText('Swing: 15%')).toBeInTheDocument()

    act(() => {
      Swing.set(22)
    })
    rerender(<SwingSlider />)
    expect(screen.getByText('Swing: 22%')).toBeInTheDocument()
  })

  it('debounces swing value updates', async () => {
    render(<SwingSlider />)

    const slider = screen.getByLabelText(/Swing:/) as HTMLInputElement

    // Rapidly change the value multiple times
    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '10',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '15',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '20',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce to complete (100ms default delay)
    await act(async () => {
      await new Promise(r => setTimeout(r, 120))
    })

    // Should have the final value
    expect(Swing.ref()).toBe(20)
  })
})
