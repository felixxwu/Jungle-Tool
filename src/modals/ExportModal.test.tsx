import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { ExportModal } from './ExportModal'
import { Layers, Modal } from '../lib/store'
import { exportCombined } from '../actions/exportCombined'
import { exportLayer } from '../actions/exportLayer'
import type { Layer } from '../lib/types'

// Mock actions
vi.mock('../actions/exportCombined', () => ({
  exportCombined: vi.fn(),
}))

vi.mock('../actions/exportLayer', () => ({
  exportLayer: vi.fn(),
}))

describe('ExportModal', () => {
  const mockLayer1: Layer = {
    filename: 'Amen Brother (1)',
    volume: 50,
    pitch: 0,
  }

  const mockLayer2: Layer = {
    filename: 'Think (About It) (1)',
    volume: 70,
    pitch: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Layers.set([mockLayer1, mockLayer2])
    Modal.set(null)
  })

  it('renders export combined mix option', () => {
    render(<ExportModal />)
    expect(screen.getByText('Export combined mix')).toBeInTheDocument()
  })

  it('renders export options for each layer', () => {
    render(<ExportModal />)
    expect(screen.getByText('Export Amen Brother (1) layer')).toBeInTheDocument()
    expect(screen.getByText('Export Think (About It) (1) layer')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<ExportModal />)
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('calls exportCombined when combined mix is clicked', async () => {
    render(<ExportModal />)

    const combinedButton = screen.getByText('Export combined mix')
    await act(async () => {
      combinedButton.click()
    })

    expect(exportCombined).toHaveBeenCalledTimes(1)
  })

  it('disables combined mix button after export', async () => {
    render(<ExportModal />)

    const combinedButton = screen.getByText('Export combined mix')
    await act(async () => {
      combinedButton.click()
    })

    // Button should be disabled after export
    expect(combinedButton).toHaveAttribute('disabled')
  })

  it('calls exportLayer when a layer export is clicked', async () => {
    render(<ExportModal />)

    const layer1Button = screen.getByText('Export Amen Brother (1) layer')
    await act(async () => {
      layer1Button.click()
    })

    expect(exportLayer).toHaveBeenCalledWith(mockLayer1)
  })

  it('disables layer button after export', async () => {
    render(<ExportModal />)

    const layer1Button = screen.getByText('Export Amen Brother (1) layer')
    await act(async () => {
      layer1Button.click()
    })

    // Button should be disabled after export
    expect(layer1Button).toHaveAttribute('disabled')
  })

  it('allows exporting multiple layers independently', async () => {
    render(<ExportModal />)

    const layer1Button = screen.getByText('Export Amen Brother (1) layer')
    const layer2Button = screen.getByText('Export Think (About It) (1) layer')

    await act(async () => {
      layer1Button.click()
    })

    await act(async () => {
      layer2Button.click()
    })

    expect(exportLayer).toHaveBeenCalledWith(mockLayer1)
    expect(exportLayer).toHaveBeenCalledWith(mockLayer2)
    expect(exportLayer).toHaveBeenCalledTimes(2)
  })

  it('closes modal when close button is clicked', async () => {
    render(<ExportModal />)

    const closeButton = screen.getByText('Close')
    await act(async () => {
      closeButton.click()
    })

    expect(Modal.ref()).toBe(null)
  })

  it('handles empty layers list', () => {
    Layers.set([])
    render(<ExportModal />)

    expect(screen.getByText('Export combined mix')).toBeInTheDocument()
    expect(screen.queryByText(/Export .* layer/)).not.toBeInTheDocument()
  })
})
