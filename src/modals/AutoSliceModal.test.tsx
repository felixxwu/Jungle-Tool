import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { AutoSliceModal } from './AutoSliceModal'
import { Modal, AutoSliceMode } from '../lib/store'
import { autoSlice } from '../actions/autoSlice'

// Mock actions
vi.mock('../actions/autoSlice', () => ({
  autoSlice: vi.fn(),
}))

describe('AutoSliceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Modal.set(null)
    AutoSliceMode.set(false)
  })

  it('renders warning message', () => {
    render(<AutoSliceModal />)
    expect(
      screen.getByText('Auto-slicing will replace all existing slices. Do you want to continue?')
    ).toBeInTheDocument()
  })

  it('renders No and Yes buttons', () => {
    render(<AutoSliceModal />)
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('closes modal when No is clicked', async () => {
    Modal.set(<AutoSliceModal />)
    render(<AutoSliceModal />)

    const noButton = screen.getByText('No')
    await act(async () => {
      noButton.click()
    })

    expect(Modal.ref()).toBe(null)
    expect(autoSlice).not.toHaveBeenCalled()
  })

  it('closes modal and triggers autoSlice when Yes is clicked', async () => {
    Modal.set(<AutoSliceModal />)
    render(<AutoSliceModal />)

    const yesButton = screen.getByText('Yes')
    await act(async () => {
      yesButton.click()
    })

    expect(Modal.ref()).toBe(null)
    expect(AutoSliceMode.ref()).toBe(true)
    expect(autoSlice).toHaveBeenCalledTimes(1)
  })
})

