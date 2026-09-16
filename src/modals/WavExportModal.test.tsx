import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { WavExportModal } from './WavExportModal'
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

describe('WavExportModal', () => {
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
    render(<WavExportModal />)
    expect(screen.getByText('Export combined mix')).toBeInTheDocument()
  })

  it('renders export options for each layer', () => {
    render(<WavExportModal />)
    expect(screen.getByText('Export Amen Brother (1) layer')).toBeInTheDocument()
    expect(screen.getByText('Export Think (About It) (1) layer')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<WavExportModal />)
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('calls exportCombined when combined mix is clicked', async () => {
    render(<WavExportModal />)

    const combinedButton = screen.getByText('Export combined mix')
    await act(async () => {
      combinedButton.click()
    })

    expect(exportCombined).toHaveBeenCalledWith({ saturation: undefined, swing: undefined })
  })

  it('disables combined mix button after export', async () => {
    render(<WavExportModal />)

    const combinedButton = screen.getByText('Export combined mix')
    await act(async () => {
      combinedButton.click()
    })

    // Button should be disabled after export
    expect(combinedButton).toHaveAttribute('disabled')
  })

  it('calls exportLayer when a layer export is clicked', async () => {
    render(<WavExportModal />)

    const layer1Button = screen.getByText('Export Amen Brother (1) layer')
    await act(async () => {
      layer1Button.click()
    })

    expect(exportLayer).toHaveBeenCalledWith(mockLayer1, { saturation: undefined, swing: undefined })
  })

  it('disables layer button after export', async () => {
    render(<WavExportModal />)

    const layer1Button = screen.getByText('Export Amen Brother (1) layer')
    await act(async () => {
      layer1Button.click()
    })

    // Button should be disabled after export
    expect(layer1Button).toHaveAttribute('disabled')
  })

  it('allows exporting multiple layers independently', async () => {
    render(<WavExportModal />)

    const layer1Button = screen.getByText('Export Amen Brother (1) layer')
    const layer2Button = screen.getByText('Export Think (About It) (1) layer')

    await act(async () => {
      layer1Button.click()
    })

    await act(async () => {
      layer2Button.click()
    })

    expect(exportLayer).toHaveBeenCalledWith(mockLayer1, { saturation: undefined, swing: undefined })
    expect(exportLayer).toHaveBeenCalledWith(mockLayer2, { saturation: undefined, swing: undefined })
    expect(exportLayer).toHaveBeenCalledTimes(2)
  })

  it('renders saturation and swing toggles, both on by default', () => {
    render(<WavExportModal />)
    expect(screen.getByText('Saturation: yes')).toBeInTheDocument()
    expect(screen.getByText('Swing: yes')).toBeInTheDocument()
  })

  it('exports with saturation disabled when toggled off', async () => {
    render(<WavExportModal />)

    await act(async () => {
      screen.getByText('Saturation: yes').click()
    })

    expect(screen.getByText('Saturation: no')).toBeInTheDocument()

    await act(async () => {
      screen.getByText('Export combined mix').click()
    })

    expect(exportCombined).toHaveBeenCalledWith({ saturation: 0, swing: undefined })
  })

  it('exports with swing disabled when toggled off', async () => {
    render(<WavExportModal />)

    await act(async () => {
      screen.getByText('Swing: yes').click()
    })

    expect(screen.getByText('Swing: no')).toBeInTheDocument()

    await act(async () => {
      screen.getByText('Export combined mix').click()
    })

    expect(exportCombined).toHaveBeenCalledWith({ saturation: undefined, swing: 0 })
  })

  it('closes modal when close button is clicked', async () => {
    render(<WavExportModal />)

    const closeButton = screen.getByText('Close')
    await act(async () => {
      closeButton.click()
    })

    expect(Modal.ref()).toBe(null)
  })

  it('handles empty layers list', () => {
    Layers.set([])
    render(<WavExportModal />)

    expect(screen.getByText('Export combined mix')).toBeInTheDocument()
    expect(screen.queryByText(/Export .* layer/)).not.toBeInTheDocument()
  })
})
