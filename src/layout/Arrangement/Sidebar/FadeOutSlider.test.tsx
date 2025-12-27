import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { FadeOutSlider } from './FadeOutSlider'
import { NoteFadeOut } from '../../../lib/store'
import { minNoteFadeOut, maxNoteFadeOut } from '../../../lib/consts'

describe('FadeOutSlider', () => {
  beforeEach(() => {
    NoteFadeOut.set(minNoteFadeOut) // Default fade out
  })

  it('renders the fade out slider', () => {
    render(<FadeOutSlider />)
    expect(screen.getByText(/Fade Out:/)).toBeInTheDocument()
  })

  it('displays the current fade out value in milliseconds', () => {
    NoteFadeOut.set(100)
    render(<FadeOutSlider />)
    expect(screen.getByText('Fade Out: 100ms')).toBeInTheDocument()
  })

  it('updates fade out value when slider is changed', async () => {
    render(<FadeOutSlider />)

    const slider = screen.getByLabelText(/Fade Out:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '150',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(NoteFadeOut.ref()).toBe(150)
  })

  it('respects minimum fade out value', async () => {
    NoteFadeOut.set(100)
    render(<FadeOutSlider />)

    const slider = screen.getByLabelText(/Fade Out:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: String(minNoteFadeOut),
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(NoteFadeOut.ref()).toBe(minNoteFadeOut)
  })

  it('respects maximum fade out value', async () => {
    NoteFadeOut.set(200)
    render(<FadeOutSlider />)

    const slider = screen.getByLabelText(/Fade Out:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: String(maxNoteFadeOut),
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(NoteFadeOut.ref()).toBe(maxNoteFadeOut)
  })

  it('updates display when fade out value changes externally', () => {
    NoteFadeOut.set(50)
    const { rerender } = render(<FadeOutSlider />)
    expect(screen.getByText('Fade Out: 50ms')).toBeInTheDocument()

    NoteFadeOut.set(200)
    rerender(<FadeOutSlider />)
    expect(screen.getByText('Fade Out: 200ms')).toBeInTheDocument()
  })

  it('debounces fade out value updates', async () => {
    render(<FadeOutSlider />)

    const slider = screen.getByLabelText(/Fade Out:/) as HTMLInputElement

    // Rapidly change the value multiple times
    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '50',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '100',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '150',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce to complete (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    // Should have the final value
    expect(NoteFadeOut.ref()).toBe(150)
  })
})

