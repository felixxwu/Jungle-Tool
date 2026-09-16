import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { ExportModal } from './ExportModal'
import { CurrentUser, Modal } from '../lib/store'
import { signInWithPopup, signOut } from 'firebase/auth'

vi.mock('firebase/auth', async importOriginal => ({
  ...(await importOriginal<typeof import('firebase/auth')>()),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

describe('ExportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Modal.set(null)
    CurrentUser.set(null)
  })

  afterEach(() => {
    CurrentUser.set(null)
  })

  it('renders the WAV export entry point', () => {
    render(<ExportModal />)
    expect(screen.getByText('Export layers to WAV')).toBeInTheDocument()
  })

  it('opens the WavExportModal when clicked', async () => {
    render(<ExportModal />)

    await act(async () => {
      screen.getByText('Export layers to WAV').click()
    })

    expect(Modal.ref()).not.toBe(null)
  })

  it('shows log in with Google when logged out', () => {
    render(<ExportModal />)
    expect(screen.getByText('Log in with Google')).toBeInTheDocument()
  })

  it('disables save/load arrangement when logged out', () => {
    render(<ExportModal />)
    expect(screen.getByText('Save / load arrangement')).toHaveAttribute('disabled')
  })

  it('does not open ArrangementsModal when disabled save/load is clicked', async () => {
    render(<ExportModal />)

    await act(async () => {
      screen.getByText('Save / load arrangement').click()
    })

    expect(Modal.ref()).toBe(null)
  })

  it('calls signInWithPopup when log in is clicked', async () => {
    render(<ExportModal />)

    await act(async () => {
      screen.getByText('Log in with Google').click()
    })

    expect(signInWithPopup).toHaveBeenCalledTimes(1)
  })

  it('shows log out and save/load option when logged in', () => {
    act(() => {
      CurrentUser.set({ uid: '123', displayName: 'Felix Wu' } as never)
    })
    render(<ExportModal />)

    expect(screen.getByText('Log out (Felix Wu)')).toBeInTheDocument()
    expect(screen.getByText('Save / load arrangement')).not.toHaveAttribute('disabled')
  })

  it('opens ArrangementsModal when save/load is clicked while logged in', async () => {
    act(() => {
      CurrentUser.set({ uid: '123', displayName: 'Felix Wu' } as never)
    })
    render(<ExportModal />)

    await act(async () => {
      screen.getByText('Save / load arrangement').click()
    })

    expect(Modal.ref()).not.toBe(null)
  })

  it('calls signOut when log out is clicked', async () => {
    act(() => {
      CurrentUser.set({ uid: '123', displayName: 'Felix Wu' } as never)
    })
    render(<ExportModal />)

    await act(async () => {
      screen.getByText('Log out (Felix Wu)').click()
    })

    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('closes modal when close button is clicked', async () => {
    render(<ExportModal />)

    await act(async () => {
      screen.getByText('Close').click()
    })

    expect(Modal.ref()).toBe(null)
  })
})
