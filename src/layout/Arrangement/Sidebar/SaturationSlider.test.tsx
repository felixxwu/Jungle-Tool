import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { SaturationSlider } from './SaturationSlider'
import { Saturation } from '../../../lib/store'

describe('SaturationSlider', () => {
  beforeEach(() => {
    Saturation.set(50) // Default saturation
  })

  it('renders the saturation slider', () => {
    render(<SaturationSlider />)
    expect(screen.getByText(/Sat:/)).toBeInTheDocument()
  })

  it('displays saturation as percentage when value is <= 50', () => {
    Saturation.set(25)
    render(<SaturationSlider />)
    // At 25, should show 25 * 2 = 50%
    expect(screen.getByText('Sat: 50%')).toBeInTheDocument()
  })

  it('displays saturation as dB gain when value is > 50', () => {
    Saturation.set(75)
    render(<SaturationSlider />)
    // At 75, should show +((75-50)/50)*12 = +6db
    expect(screen.getByText('Sat: +6db')).toBeInTheDocument()
  })

  it('displays 0% at minimum saturation', () => {
    Saturation.set(0)
    render(<SaturationSlider />)
    expect(screen.getByText('Sat: 0%')).toBeInTheDocument()
  })

  it('displays 100% at 50 saturation', () => {
    Saturation.set(50)
    render(<SaturationSlider />)
    expect(screen.getByText('Sat: 100%')).toBeInTheDocument()
  })

  it('displays maximum dB gain at 100 saturation', () => {
    Saturation.set(100)
    render(<SaturationSlider />)
    // At 100, should show +((100-50)/50)*12 = +12db
    expect(screen.getByText('Sat: +12db')).toBeInTheDocument()
  })

  it('updates saturation value when slider is changed', async () => {
    render(<SaturationSlider />)

    const slider = screen.getByLabelText(/Sat:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '60',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce (default 100ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 120))
    })

    expect(Saturation.ref()).toBe(60)
  })

  it('updates display when saturation value changes externally', () => {
    Saturation.set(30)
    const { rerender } = render(<SaturationSlider />)
    expect(screen.getByText('Sat: 60%')).toBeInTheDocument()

    Saturation.set(80)
    rerender(<SaturationSlider />)
    expect(screen.getByText('Sat: +7db')).toBeInTheDocument()
  })

  it('debounces saturation value updates', async () => {
    render(<SaturationSlider />)

    const slider = screen.getByLabelText(/Sat:/) as HTMLInputElement

    // Rapidly change the value multiple times
    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '40',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '60',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '70',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce to complete (default 100ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 120))
    })

    // Should have the final value
    expect(Saturation.ref()).toBe(70)
  })
})

