import { describe, it, expect, beforeEach, vi } from 'vitest'
import { downloadAsWav } from './downloadAsWav'
import { WaveFile } from 'wavefile'
import { SAMPLE_RATE } from '../lib/consts'

// Mock WaveFile
vi.mock('wavefile', () => ({
  WaveFile: vi.fn().mockImplementation(() => ({
    fromScratch: vi.fn(),
    toBuffer: vi.fn(() => new ArrayBuffer(8)),
  })),
}))

describe('downloadAsWav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock DOM methods
    window.URL.createObjectURL = vi.fn(() => 'mocked-url')
    window.URL.revokeObjectURL = vi.fn()
    document.createElement = vi.fn((tag: string) => {
      const element = {
        tagName: tag,
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      } as any
      return element
    })
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  it('creates WAV file from stereo samples', () => {
    const samples: [Float32Array, Float32Array] = [new Float32Array(44100), new Float32Array(44100)]

    downloadAsWav(samples, 'test-file')

    expect(WaveFile).toHaveBeenCalledTimes(1)
    const mockWaveFile = (WaveFile as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockWaveFile.fromScratch).toHaveBeenCalledWith(2, SAMPLE_RATE, '16', samples)
    expect(mockWaveFile.toBuffer).toHaveBeenCalled()
  })

  it('creates download link with correct filename', () => {
    const samples: [Float32Array, Float32Array] = [new Float32Array(1000), new Float32Array(1000)]

    downloadAsWav(samples, 'my-break.wav')

    expect(document.createElement).toHaveBeenCalledWith('a')
    const link = (document.createElement as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(link.download).toBe('my-breakwav') // Dots are removed
    expect(link.href).toBe('mocked-url')
  })

  it('removes first dot from filename', () => {
    const samples: [Float32Array, Float32Array] = [new Float32Array(1000), new Float32Array(1000)]

    downloadAsWav(samples, 'test.file.name.wav')

    const link = (document.createElement as ReturnType<typeof vi.fn>).mock.results[0].value
    // Only the first dot is removed by replace('.', '')
    expect(link.download).toBe('testfile.name.wav')
  })

  it('creates blob with correct MIME type', () => {
    const samples: [Float32Array, Float32Array] = [new Float32Array(1000), new Float32Array(1000)]

    downloadAsWav(samples, 'test')

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    const blobCall = (window.URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(blobCall.type).toBe('audio/wav')
  })

  it('triggers download and cleans up', () => {
    const samples: [Float32Array, Float32Array] = [new Float32Array(1000), new Float32Array(1000)]

    downloadAsWav(samples, 'test')

    const link = (document.createElement as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(document.body.appendChild).toHaveBeenCalledWith(link)
    expect(link.click).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalledWith(link)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mocked-url')
  })

  it('handles empty samples', () => {
    const samples: [Float32Array, Float32Array] = [new Float32Array(0), new Float32Array(0)]

    downloadAsWav(samples, 'empty')

    expect(WaveFile).toHaveBeenCalled()
    const mockWaveFile = (WaveFile as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockWaveFile.fromScratch).toHaveBeenCalledWith(2, SAMPLE_RATE, '16', samples)
  })
})
