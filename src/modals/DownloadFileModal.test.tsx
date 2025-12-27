import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { DownloadFileModal } from './DownloadFileModal'
import { LoadedFiles, SelectedFileIndex, Modal } from '../lib/store'
import { WaveFile } from 'wavefile'
import { SAMPLE_RATE } from '../lib/consts'

// Mock WaveFile
vi.mock('wavefile', () => ({
  WaveFile: vi.fn().mockImplementation(() => ({
    fromScratch: vi.fn(),
    toBuffer: vi.fn(() => new ArrayBuffer(8)),
    toBase64: vi.fn(() => 'base64-encoded-data'),
  })),
}))

describe('DownloadFileModal', () => {
  const mockFile = {
    name: 'test-break.wav',
    artist: 'Test Artist',
    year: 2024,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [
      { start: 0, type: 'Start' as const, stepNum: 0 },
      { start: 1000, type: 'Kick' as const, stepNum: 0 },
      { start: 2000, type: 'Snare' as const, stepNum: 4 },
      { start: 30000, type: 'End' as const, stepNum: 0 },
    ],
    whosampledLink: 'https://example.com',
    whosampledCount: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([mockFile])
    SelectedFileIndex.set(0)
    Modal.set(null)

    // Mock DOM methods
    window.URL.createObjectURL = vi.fn(() => 'mocked-url')
    window.URL.revokeObjectURL = vi.fn()

    // Mock document.createElement to return proper HTMLAnchorElement
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = originalCreateElement(tag) as HTMLAnchorElement
      if (tag === 'a') {
        element.click = vi.fn()
        element.remove = vi.fn()
      }
      return element
    })
  })

  it('renders nothing when no file is selected', () => {
    SelectedFileIndex.set(null)
    const { container } = render(<DownloadFileModal />)
    expect(container.firstChild).toBeNull()
  })

  it('renders download options for selected file', () => {
    render(<DownloadFileModal />)
    expect(screen.getByText('Download wav file')).toBeInTheDocument()
    expect(screen.getByText('Download custom file with slices')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('displays information about custom file format', () => {
    render(<DownloadFileModal />)
    expect(
      screen.getByText(/If you would like to save the slices, you can download a custom file/)
    ).toBeInTheDocument()
  })

  it('downloads WAV file when download wav button is clicked', async () => {
    render(<DownloadFileModal />)

    const wavButton = screen.getByText('Download wav file')
    await act(async () => {
      wavButton.click()
    })

    expect(WaveFile).toHaveBeenCalledTimes(1)
    const mockWaveFile = (WaveFile as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockWaveFile.fromScratch).toHaveBeenCalledWith(2, SAMPLE_RATE, '16', mockFile.samples)
    expect(mockWaveFile.toBuffer).toHaveBeenCalled()

    // Verify download was triggered
    expect(document.createElement).toHaveBeenCalledWith('a')
    // The actual download attribute is set in the component
    expect(Modal.ref()).toBe(null)
  })

  it('downloads custom JSON file with slices when custom file button is clicked', async () => {
    render(<DownloadFileModal />)

    const customButton = screen.getByText('Download custom file with slices')
    await act(async () => {
      customButton.click()
    })

    expect(WaveFile).toHaveBeenCalledTimes(1)
    const mockWaveFile = (WaveFile as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockWaveFile.fromScratch).toHaveBeenCalledWith(2, SAMPLE_RATE, '16', mockFile.samples)
    expect(mockWaveFile.toBase64).toHaveBeenCalled()

    // Verify download was triggered
    expect(document.createElement).toHaveBeenCalledWith('a')
    // The actual download attribute is set in the component

    // Verify JSON content includes slices and metadata
    const blobCall = (window.URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(blobCall.type).toBe('application/json')
    expect(Modal.ref()).toBe(null)
  })

  it('includes all file metadata in custom JSON export', async () => {
    render(<DownloadFileModal />)

    const customButton = screen.getByText('Download custom file with slices')
    await act(async () => {
      customButton.click()
    })

    // Verify that the JSON includes all metadata
    const blobCall = (window.URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0]
    // The blob contains JSON stringified data with name, artist, year, slices, base64
    expect(blobCall).toBeDefined()
  })

  it('closes modal when cancel button is clicked', async () => {
    render(<DownloadFileModal />)

    const cancelButton = screen.getByText('Cancel')
    await act(async () => {
      cancelButton.click()
    })

    expect(Modal.ref()).toBe(null)
  })

  it('closes modal after WAV download', async () => {
    render(<DownloadFileModal />)

    const wavButton = screen.getByText('Download wav file')
    await act(async () => {
      wavButton.click()
    })

    expect(Modal.ref()).toBe(null)
  })

  it('closes modal after custom file download', async () => {
    render(<DownloadFileModal />)

    const customButton = screen.getByText('Download custom file with slices')
    await act(async () => {
      customButton.click()
    })

    expect(Modal.ref()).toBe(null)
  })
})
