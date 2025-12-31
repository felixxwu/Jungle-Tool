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

  it('duplicates modified first bar when adding second bar after modifications', async () => {
    // Set up initial arrangement with notes in first bar
    Arrangement.set([
      { startStep: 0, stepNumToPlay: 0 },
      { startStep: 4, stepNumToPlay: 4 },
    ])

    render(<BarSelection />)

    // Modify the first bar by adding and removing notes
    // This simulates what happens when user edits in the Grid component
    await act(async () => {
      Arrangement.set([
        { startStep: 0, stepNumToPlay: 0 },
        { startStep: 2, stepNumToPlay: 2 }, // Added new note
        { startStep: 8, stepNumToPlay: 8 }, // Added new note
        // Removed the note at step 4
      ])
    })

    // Immediately add a new bar (simulating user clicking + right after editing)
    const addButton = screen.getByText('+')
    await act(async () => {
      addButton.click()
    })

    // Wait for any debounce to complete
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    const arrangement = Arrangement.ref()
    // Should have the modified first bar (3 notes) + duplicated bar (3 notes) = 6 notes total
    expect(arrangement.length).toBe(6)

    // Verify first bar has the modified notes
    const firstBarNotes = arrangement.filter(n => n.startStep < 16)
    expect(firstBarNotes.length).toBe(3)
    expect(firstBarNotes.some(n => n.startStep === 0)).toBe(true)
    expect(firstBarNotes.some(n => n.startStep === 2)).toBe(true)
    expect(firstBarNotes.some(n => n.startStep === 8)).toBe(true)
    expect(firstBarNotes.some(n => n.startStep === 4)).toBe(false) // Should not have the removed note

    // Verify second bar has duplicated notes from modified first bar
    const secondBarNotes = arrangement.filter(n => n.startStep >= 16 && n.startStep < 32)
    expect(secondBarNotes.length).toBe(3)
    expect(secondBarNotes.some(n => n.startStep === 16)).toBe(true) // Duplicated from step 0
    expect(secondBarNotes.some(n => n.startStep === 18)).toBe(true) // Duplicated from step 2
    expect(secondBarNotes.some(n => n.startStep === 24)).toBe(true) // Duplicated from step 8
  })

  it('duplicates first bar correctly even when first bar is completely modified', async () => {
    // Set up initial arrangement
    Arrangement.set([
      { startStep: 0, stepNumToPlay: 0 },
      { startStep: 4, stepNumToPlay: 4 },
    ])

    render(<BarSelection />)

    // Completely replace the first bar with new notes
    await act(async () => {
      Arrangement.set([
        { startStep: 1, stepNumToPlay: 1 },
        { startStep: 5, stepNumToPlay: 5 },
        { startStep: 9, stepNumToPlay: 9 },
        { startStep: 13, stepNumToPlay: 13 },
      ])
    })

    // Add a new bar immediately
    const addButton = screen.getByText('+')
    await act(async () => {
      addButton.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    const arrangement = Arrangement.ref()
    // Should have 4 notes in first bar + 4 duplicated in second bar = 8 notes
    expect(arrangement.length).toBe(8)

    // Verify first bar has the new notes
    const firstBarNotes = arrangement.filter(n => n.startStep < 16)
    expect(firstBarNotes.length).toBe(4)
    expect(firstBarNotes.some(n => n.startStep === 1)).toBe(true)
    expect(firstBarNotes.some(n => n.startStep === 5)).toBe(true)
    expect(firstBarNotes.some(n => n.startStep === 9)).toBe(true)
    expect(firstBarNotes.some(n => n.startStep === 13)).toBe(true)

    // Verify second bar has duplicated notes
    const secondBarNotes = arrangement.filter(n => n.startStep >= 16 && n.startStep < 32)
    expect(secondBarNotes.length).toBe(4)
    expect(secondBarNotes.some(n => n.startStep === 17)).toBe(true) // Duplicated from step 1
    expect(secondBarNotes.some(n => n.startStep === 21)).toBe(true) // Duplicated from step 5
    expect(secondBarNotes.some(n => n.startStep === 25)).toBe(true) // Duplicated from step 9
    expect(secondBarNotes.some(n => n.startStep === 29)).toBe(true) // Duplicated from step 13
  })

  it('handles adding bar when first bar is empty', async () => {
    // Set up with empty first bar
    await act(async () => {
      Arrangement.set([])
    })

    render(<BarSelection />)

    // Add a new bar
    const addButton = screen.getByText('+')
    await act(async () => {
      addButton.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    const arrangement = Arrangement.ref()
    // Should still have empty arrangement (empty first bar duplicated = empty second bar)
    expect(arrangement.length).toBe(0)
  })
})
