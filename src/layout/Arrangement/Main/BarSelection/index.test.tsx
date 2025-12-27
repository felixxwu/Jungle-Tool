import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../../../../test/test-utils'
import { BarSelection } from './index'
import { Arrangement, NumBars, SelectedBar } from '../../../../lib/store'

describe('BarSelection', () => {
  beforeEach(() => {
    // Reset state
    NumBars.set(1)
    SelectedBar.set(0)
    Arrangement.set([
      { startStep: 0, stepNumToPlay: 0 },
      { startStep: 4, stepNumToPlay: 4 },
    ])
  })

  it('renders the current number of bars', () => {
    NumBars.set(2)
    render(<BarSelection />)

    expect(screen.getByText('Bar 1')).toBeInTheDocument()
    expect(screen.getByText('Bar 2')).toBeInTheDocument()
  })

  it('adds a bar when + button is clicked', async () => {
    render(<BarSelection />)

    const addButton = screen.getByText('+')
    expect(addButton).toBeInTheDocument()

    await act(async () => {
      addButton.click()
    })

    // Should have 2 bars now
    expect(NumBars.ref()).toBe(2)
    expect(screen.getByText('Bar 1')).toBeInTheDocument()
    expect(screen.getByText('Bar 2')).toBeInTheDocument()
  })

  it('duplicates first bar when adding second bar', async () => {
    render(<BarSelection />)

    const addButton = screen.getByText('+')
    await act(async () => {
      addButton.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    const arrangement = Arrangement.ref()
    // Should have duplicated the first bar
    expect(arrangement.length).toBe(4) // 2 original + 2 duplicated
    // Original notes should be in bar 0
    expect(arrangement.some(n => n.startStep === 0)).toBe(true)
    // Duplicated notes should be in bar 1
    expect(arrangement.some(n => n.startStep === 16)).toBe(true)
  })

  it('selects the new bar after adding it', async () => {
    render(<BarSelection />)

    const addButton = screen.getByText('+')
    await act(async () => {
      addButton.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    // Selected bar should be the newly added bar (bar 1, index 1)
    expect(SelectedBar.ref()).toBe(1)
  })

  it('shows remove button when there is more than one bar', () => {
    NumBars.set(2)
    render(<BarSelection />)

    const removeButton = screen.getByText('x')
    expect(removeButton).toBeInTheDocument()
  })

  it('removes a bar when remove button is clicked', async () => {
    NumBars.set(3)
    // Create 3 bars with 16 notes each (48 notes total)
    const notes = []
    for (let bar = 0; bar < 3; bar++) {
      for (let step = 0; step < 16; step++) {
        notes.push({ startStep: bar * 16 + step, stepNumToPlay: step % 4 })
      }
    }
    Arrangement.set(notes)
    SelectedBar.set(2)

    render(<BarSelection />)

    const removeButton = screen.getByText('x')
    const initialArrangementLength = Arrangement.ref().length
    expect(initialArrangementLength).toBe(48) // 3 bars * 16 notes

    await act(async () => {
      removeButton.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    // Should have one less bar
    expect(NumBars.ref()).toBe(2)
    // Arrangement should have 16 fewer notes (one bar removed)
    expect(Arrangement.ref().length).toBe(initialArrangementLength - 16)
    // Selected bar should be adjusted (was 2, now should be 1 since we removed the last bar)
    expect(SelectedBar.ref()).toBe(1)
  })

  it('does not show remove button when there is only one bar', () => {
    NumBars.set(1)
    render(<BarSelection />)

    const removeButton = screen.queryByText('x')
    expect(removeButton).not.toBeInTheDocument()
  })

  it('does not show add button when there are 4 bars', () => {
    NumBars.set(4)
    render(<BarSelection />)

    const addButton = screen.queryByText('+')
    expect(addButton).not.toBeInTheDocument()
  })

  it('allows selecting different bars', async () => {
    NumBars.set(3)
    render(<BarSelection />)

    const bar2Button = screen.getByText('Bar 2')
    await act(async () => {
      bar2Button.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    expect(SelectedBar.ref()).toBe(1) // Bar 2 is index 1
  })
})
