import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { importFile } from './importFile'
import { loadJson } from './loadJson'
import { loadWav } from './loadWav'
import { LoadedFiles } from '../lib/store'

// Mock actions
vi.mock('./loadJson', () => ({
  loadJson: vi.fn(),
}))

vi.mock('./loadWav', () => ({
  loadWav: vi.fn(),
}))

describe('importFile', () => {
  let mockFileInput: HTMLInputElement
  let mockFileReader: FileReader

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([
      {
        name: 'Apache',
        artist: '',
        year: 0,
        samples: [new Float32Array(1), new Float32Array(1)],
        slices: [],
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])

    // Mock FileReader
    mockFileReader = {
      readAsText: vi.fn(),
      readAsArrayBuffer: vi.fn(),
      onload: null,
      result: null,
    } as any

    window.FileReader = vi.fn(() => mockFileReader) as any

    // Mock document.createElement
    mockFileInput = {
      type: '',
      accept: '',
      click: vi.fn(),
      remove: vi.fn(),
      onchange: null,
    } as any

    document.createElement = vi.fn((tag: string) => {
      if (tag === 'input') {
        return mockFileInput as any
      }
      return document.createElement(tag)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates file input element with correct attributes', () => {
    importFile()

    expect(document.createElement).toHaveBeenCalledWith('input')
    expect(mockFileInput.type).toBe('file')
    expect(mockFileInput.accept).toBe('.wav, .json')
  })

  it('triggers file input click', () => {
    importFile()
    expect(mockFileInput.click).toHaveBeenCalledTimes(1)
  })

  it('removes file input after setup', () => {
    importFile()
    expect(mockFileInput.remove).toHaveBeenCalledTimes(1)
  })

  it('loads JSON file when JSON file is selected', () => {
    importFile()

    const mockFile = {
      type: 'application/json',
      name: 'test.json',
    } as File

    const mockFileList = {
      0: mockFile,
      length: 1,
      item: (index: number) => (index === 0 ? mockFile : null),
    } as unknown as FileList

    // Simulate file selection
    const changeEvent = {
      target: { files: mockFileList },
    } as any

    if (mockFileInput.onchange) {
      mockFileInput.onchange(changeEvent)
    }

    expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile)
    expect(mockFileReader.readAsArrayBuffer).not.toHaveBeenCalled()

    // Simulate FileReader onload
    Object.defineProperty(mockFileReader, 'result', {
      value: '{"name": "Apache"}',
      writable: true,
      configurable: true,
    })
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any)
    }

    // Apache is already loaded, so the import gets a name of its own.
    expect(loadJson).toHaveBeenCalledWith('{"name": "Apache"}', 'Apache (2)')
  })

  it.each(['audio/x-wav', 'audio/vnd.wave', ''])(
    'loads a .wav file whose type the browser reports as %j',
    type => {
      importFile()
      const mockFile = { type, name: 'BREAK.WAV' } as File
      const changeEvent = { target: { files: { 0: mockFile, length: 1 } } } as any
      mockFileInput.onchange?.(changeEvent)

      expect(mockFileReader.readAsArrayBuffer).toHaveBeenCalledWith(mockFile)
    }
  )

  it('loads WAV file when WAV file is selected', () => {
    importFile()

    const mockArrayBuffer = new ArrayBuffer(8)
    const mockFile = {
      type: 'audio/wav',
      name: 'test.wav',
    } as File

    const mockFileList = {
      0: mockFile,
      length: 1,
      item: (index: number) => (index === 0 ? mockFile : null),
    } as unknown as FileList

    // Simulate file selection
    const changeEvent = {
      target: { files: mockFileList },
    } as any

    if (mockFileInput.onchange) {
      mockFileInput.onchange(changeEvent)
    }

    expect(mockFileReader.readAsArrayBuffer).toHaveBeenCalledWith(mockFile)
    expect(mockFileReader.readAsText).not.toHaveBeenCalled()

    // Simulate FileReader onload
    Object.defineProperty(mockFileReader, 'result', {
      value: mockArrayBuffer,
      writable: true,
      configurable: true,
    })
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any)
    }

    expect(loadWav).toHaveBeenCalledWith(mockArrayBuffer, 'test.wav')
  })

  it('does nothing when no file is selected', () => {
    importFile()

    const changeEvent = {
      target: { files: null },
    } as any

    if (mockFileInput.onchange) {
      mockFileInput.onchange(changeEvent)
    }

    expect(mockFileReader.readAsText).not.toHaveBeenCalled()
    expect(mockFileReader.readAsArrayBuffer).not.toHaveBeenCalled()
  })

  it('does nothing when files array is empty', () => {
    importFile()

    const mockFileList = {
      length: 0,
      item: () => null,
    } as unknown as FileList

    const changeEvent = {
      target: { files: mockFileList },
    } as any

    if (mockFileInput.onchange) {
      mockFileInput.onchange(changeEvent)
    }

    expect(mockFileReader.readAsText).not.toHaveBeenCalled()
    expect(mockFileReader.readAsArrayBuffer).not.toHaveBeenCalled()
  })
})
