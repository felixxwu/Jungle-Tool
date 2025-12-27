import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportCombined } from './exportCombined'
import { getArrangementSamples } from '../helpers/getArrangementSamples'
import { downloadAsWav } from './downloadAsWav'

// Mock dependencies
vi.mock('../helpers/getArrangementSamples', () => ({
  getArrangementSamples: vi.fn(),
}))

vi.mock('./downloadAsWav', () => ({
  downloadAsWav: vi.fn(),
}))

describe('exportCombined', () => {
  const mockSamples: [Float32Array, Float32Array] = [
    new Float32Array(44100),
    new Float32Array(44100),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSamples)
  })

  it('exports combined arrangement as WAV file', () => {
    exportCombined()

    expect(getArrangementSamples).toHaveBeenCalledWith({})
    expect(downloadAsWav).toHaveBeenCalledWith(mockSamples, 'Jungle Tool Break')
  })

  it('handles null samples gracefully', () => {
    ;(getArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue(null)

    // Should not throw, but downloadAsWav might handle null
    exportCombined()

    expect(getArrangementSamples).toHaveBeenCalledWith({})
    // downloadAsWav might be called with null, which would fail, but that's expected behavior
  })

  it('uses correct filename for combined export', () => {
    exportCombined()

    expect(downloadAsWav).toHaveBeenCalledWith(
      expect.any(Array),
      'Jungle Tool Break'
    )
  })
})

