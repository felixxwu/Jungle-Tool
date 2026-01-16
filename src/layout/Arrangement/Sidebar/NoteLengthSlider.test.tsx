import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { NoteLengthSlider } from './NoteLengthSlider'
import { NoteLength } from '../../../lib/store'
import { minNoteLength, maxNoteLength } from '../../../lib/consts'

describe('NoteLengthSlider', () => {
  beforeEach(() => {
    NoteLength.set(maxNoteLength) // Default note length
  })

  it('renders the note length slider', () => {
    render(<NoteLengthSlider />)
    expect(screen.getByText(/Slice Len:/)).toBeInTheDocument()
  })

  it('displays the current note length in milliseconds', () => {
    NoteLength.set(200)
    render(<NoteLengthSlider />)
    expect(screen.getByText('Slice Len: 200ms')).toBeInTheDocument()
  })

  it('updates note length value when slider is changed', async () => {
    render(<NoteLengthSlider />)

    const slider = screen.getByLabelText(/Slice Len:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '300',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(NoteLength.ref()).toBe(300)
  })

  it('respects minimum note length value', async () => {
    NoteLength.set(200)
    render(<NoteLengthSlider />)

    const slider = screen.getByLabelText(/Slice Len:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: String(minNoteLength),
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(NoteLength.ref()).toBe(minNoteLength)
  })

  it('respects maximum note length value', async () => {
    NoteLength.set(200)
    render(<NoteLengthSlider />)

    const slider = screen.getByLabelText(/Slice Len:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: String(maxNoteLength),
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    expect(NoteLength.ref()).toBe(maxNoteLength)
  })

  it('updates display when note length value changes externally', () => {
    NoteLength.set(150)
    const { rerender } = render(<NoteLengthSlider />)
    expect(screen.getByText('Slice Len: 150ms')).toBeInTheDocument()

    act(() => {
      NoteLength.set(250)
    })
    rerender(<NoteLengthSlider />)
    expect(screen.getByText('Slice Len: 250ms')).toBeInTheDocument()
  })

  it('debounces note length value updates', async () => {
    render(<NoteLengthSlider />)

    const slider = screen.getByLabelText(/Slice Len:/) as HTMLInputElement

    // Rapidly change the value multiple times
    await act(async () => {
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '100',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '200',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      Object.defineProperty(slider, 'value', {
        writable: true,
        value: '300',
      })
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce to complete (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    // Should have the final value
    expect(NoteLength.ref()).toBe(300)
  })
})
