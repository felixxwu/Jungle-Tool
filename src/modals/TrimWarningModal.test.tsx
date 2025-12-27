import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { TrimWarningModal } from './TrimWarningModal'
import { Modal } from '../lib/store'

describe('TrimWarningModal', () => {
  beforeEach(() => {
    Modal.set(null)
  })

  it('renders warning message', () => {
    render(<TrimWarningModal />)
    expect(
      screen.getByText(
        'Jungle Tool relies on each break being eactly one bar long. Please trim the uploaded file to one bar.'
      )
    ).toBeInTheDocument()
  })

  it('renders Ok button', () => {
    render(<TrimWarningModal />)
    expect(screen.getByText('Ok')).toBeInTheDocument()
  })

  it('closes modal when Ok is clicked', async () => {
    Modal.set(<TrimWarningModal />)
    render(<TrimWarningModal />)

    const okButton = screen.getByText('Ok')
    await act(async () => {
      okButton.click()
    })

    expect(Modal.ref()).toBe(null)
  })
})
