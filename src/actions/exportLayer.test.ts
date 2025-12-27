import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportLayer } from './exportLayer'
import { getArrangementLayerSamples } from '../helpers/getArrangementLayerSamples'
import { downloadAsWav } from './downloadAsWav'
import type { Layer } from '../lib/types'

// Mock dependencies
vi.mock('../helpers/getArrangementLayerSamples', () => ({
  getArrangementLayerSamples: vi.fn(),
}))

vi.mock('./downloadAsWav', () => ({
  downloadAsWav: vi.fn(),
}))

describe('exportLayer', () => {
  const mockLayer: Layer = {
    filename: 'Amen Brother (1)',
    volume: 50,
    pitch: 0,
  }

  const mockSamples: [Float32Array, Float32Array] = [
    new Float32Array(44100),
    new Float32Array(44100),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSamples)
  })

  it('exports layer as WAV file', () => {
    exportLayer(mockLayer)

    expect(getArrangementLayerSamples).toHaveBeenCalledWith({ layer: mockLayer })
    expect(downloadAsWav).toHaveBeenCalledWith(
      mockSamples,
      'Jungle Tool Break - Amen Brother (1)'
    )
  })

  it('does not export when layer samples are null', () => {
    ;(getArrangementLayerSamples as ReturnType<typeof vi.fn>).mockReturnValue(null)

    exportLayer(mockLayer)

    expect(getArrangementLayerSamples).toHaveBeenCalledWith({ layer: mockLayer })
    expect(downloadAsWav).not.toHaveBeenCalled()
  })

  it('uses correct filename format for layer export', () => {
    const layer2: Layer = {
      filename: 'Think (About It) (1)',
      volume: 70,
      pitch: 3,
    }

    exportLayer(layer2)

    expect(downloadAsWav).toHaveBeenCalledWith(
      mockSamples,
      'Jungle Tool Break - Think (About It) (1)'
    )
  })

  it('handles different layer configurations', () => {
    const layer3: Layer = {
      filename: 'Apache',
      volume: 100,
      pitch: -5,
    }

    exportLayer(layer3)

    expect(getArrangementLayerSamples).toHaveBeenCalledWith({ layer: layer3 })
    expect(downloadAsWav).toHaveBeenCalledWith(
      mockSamples,
      'Jungle Tool Break - Apache'
    )
  })
})

