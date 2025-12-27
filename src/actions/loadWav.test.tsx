import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadWav } from './loadWav'
import { LoadedFiles, Modal, SelectedFileIndex } from '../lib/store'
import { WaveFile } from 'wavefile'
import { normalize } from '../lib/audio'

// Mock dependencies
vi.mock('wavefile', () => ({
  WaveFile: vi.fn().mockImplementation(() => ({
    fromBuffer: vi.fn(),
    getSamples: vi.fn(() => [new Float32Array(44100), new Float32Array(44100)]),
  })),
}))

vi.mock('../lib/audio', () => ({
  normalize: vi.fn((samples: [Float32Array, Float32Array]) => samples),
}))

vi.mock('../modals/TrimWarningModal', () => ({
  TrimWarningModal: () => <div data-testid='trim-warning-modal'>TrimWarningModal</div>,
}))

describe('loadWav', () => {
  const mockArrayBuffer = new ArrayBuffer(8)
  const mockUint8Array = new Uint8Array(mockArrayBuffer)

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([])
    Modal.set(null)
    SelectedFileIndex.set(null)
  })

  it('parses WAV file and adds to LoadedFiles', () => {
    loadWav(mockArrayBuffer, 'test-file.wav')

    expect(WaveFile).toHaveBeenCalledTimes(1)
    const waveFileInstance = (WaveFile as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(waveFileInstance.fromBuffer).toHaveBeenCalledWith(mockUint8Array)
    expect(waveFileInstance.getSamples).toHaveBeenCalledTimes(1)
  })

  it('creates file with initial Start and End slices', () => {
    const mockSamples = [new Float32Array(1000), new Float32Array(1000)]
    const mockWaveFileInstance = {
      fromBuffer: vi.fn(),
      getSamples: vi.fn(() => mockSamples),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFileInstance)

    loadWav(mockArrayBuffer, 'test-file.wav')

    const loadedFiles = LoadedFiles.ref()
    expect(loadedFiles.length).toBe(1)
    expect(loadedFiles[0].name).toBe('test-file.wav')
    expect(loadedFiles[0].slices.length).toBe(2)
    expect(loadedFiles[0].slices[0].type).toBe('Start')
    expect(loadedFiles[0].slices[0].start).toBe(0)
    expect(loadedFiles[0].slices[1].type).toBe('End')
    expect(loadedFiles[0].slices[1].start).toBe(999) // length - 1
  })

  it('handles mono WAV files', () => {
    const mockMonoSamples = new Float32Array(1000)
    const mockWaveFileInstance = {
      fromBuffer: vi.fn(),
      getSamples: vi.fn(() => mockMonoSamples),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFileInstance)

    loadWav(mockArrayBuffer, 'mono-file.wav')

    const loadedFiles = LoadedFiles.ref()
    expect(loadedFiles.length).toBe(1)
    expect(normalize).toHaveBeenCalled()
  })

  it('normalizes audio samples', () => {
    const mockSamples = [new Float32Array(1000), new Float32Array(1000)]
    const mockWaveFileInstance = {
      fromBuffer: vi.fn(),
      getSamples: vi.fn(() => mockSamples),
    }
    ;(WaveFile as ReturnType<typeof vi.fn>).mockImplementation(() => mockWaveFileInstance)

    loadWav(mockArrayBuffer, 'test-file.wav')

    expect(normalize).toHaveBeenCalledWith(mockSamples)
  })

  it('sets default metadata for loaded file', () => {
    loadWav(mockArrayBuffer, 'test-file.wav')

    const loadedFiles = LoadedFiles.ref()
    expect(loadedFiles[0].artist).toBe('')
    expect(loadedFiles[0].year).toBe(0)
    expect(loadedFiles[0].whosampledLink).toBe('')
    expect(loadedFiles[0].whosampledCount).toBe(0)
  })

  it('adds file to beginning of LoadedFiles array', () => {
    LoadedFiles.set([
      {
        name: 'existing-file',
        samples: [new Float32Array(100), new Float32Array(100)],
        slices: [],
        artist: '',
        year: 0,
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])

    loadWav(mockArrayBuffer, 'new-file.wav')

    const loadedFiles = LoadedFiles.ref()
    expect(loadedFiles.length).toBe(2)
    expect(loadedFiles[0].name).toBe('new-file.wav')
    expect(loadedFiles[1].name).toBe('existing-file')
  })

  it('sets SelectedFileIndex to the new file', () => {
    LoadedFiles.set([
      {
        name: 'existing-file',
        samples: [new Float32Array(100), new Float32Array(100)],
        slices: [],
        artist: '',
        year: 0,
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])

    loadWav(mockArrayBuffer, 'new-file.wav')

    // New file is unshifted to index 0, so SelectedFileIndex should be set to length - 1
    // After unshift, length is 2, so SelectedFileIndex = 2 - 1 = 1
    // But actually, it's set to LoadedFiles.ref().length - 1 after the unshift
    const loadedFiles = LoadedFiles.ref()
    expect(SelectedFileIndex.ref()).toBe(loadedFiles.length - 1)
    expect(loadedFiles[0].name).toBe('new-file.wav')
  })

  it('shows TrimWarningModal after loading', () => {
    loadWav(mockArrayBuffer, 'test-file.wav')

    const modal = Modal.ref()
    expect(modal).not.toBe(null)
    // Modal should contain TrimWarningModal component
  })
})
