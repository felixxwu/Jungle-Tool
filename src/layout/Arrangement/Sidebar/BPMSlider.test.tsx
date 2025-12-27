import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { BPMSlider } from './BPMSlider'
import { BPM } from '../../../lib/store'
import { minBPM, maxBPM } from '../../../lib/consts'

describe('BPMSlider', () => {
  beforeEach(() => {
    BPM.set(160) // Default BPM
  })

  it('renders the BPM slider', () => {
    render(<BPMSlider />)
    expect(screen.getByText(/BPM:/)).toBeInTheDocument()
  })

  it('displays the current BPM value', () => {
    BPM.set(120)
    render(<BPMSlider />)
    expect(screen.getByText('BPM: 120')).toBeInTheDocument()
  })

  it('updates BPM value when slider is changed', async () => {
    render(<BPMSlider />)

    const slider = screen.getByLabelText(/BPM:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '140',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(BPM.ref()).toBe(140)
  })

  it('respects minimum BPM value (80)', async () => {
    BPM.set(100)
    render(<BPMSlider />)

    const slider = screen.getByLabelText(/BPM:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: String(minBPM),
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(BPM.ref()).toBe(minBPM)
  })

  it('respects maximum BPM value (180)', async () => {
    BPM.set(160)
    render(<BPMSlider />)

    const slider = screen.getByLabelText(/BPM:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: String(maxBPM),
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(BPM.ref()).toBe(maxBPM)
  })

  it('updates display when BPM value changes externally', () => {
    BPM.set(120)
    const { rerender } = render(<BPMSlider />)
    expect(screen.getByText('BPM: 120')).toBeInTheDocument()

    BPM.set(150)
    rerender(<BPMSlider />)
    expect(screen.getByText('BPM: 150')).toBeInTheDocument()
  })

  it('debounces BPM value updates', async () => {
    render(<BPMSlider />)

    const slider = screen.getByLabelText(/BPM:/) as HTMLInputElement

    // Rapidly change the value multiple times
    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '100',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '120',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '140',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce to complete (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    // Should have the final value
    expect(BPM.ref()).toBe(140)
  })
})
