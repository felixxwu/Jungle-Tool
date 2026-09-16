import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playFile } from './playFile'
import { LoadedFiles, PreviewSource, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { playSamples } from '../lib/audio'
import { resumeAudioContext } from '../lib/audioContext'
import { calculateDuration } from '../lib/playback'

vi.mock('../lib/audio')
vi.mock('../lib/audioContext')

describe('playFile', () => {
  const mockFile = {
    name: 'test-file',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array], // 1 second of audio
    slices: [],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockSource = {
    loop: false,
    onended: null as (() => void) | null,
    stop: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state before each test
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    PreviewSource.set(null)

    // Setup mock data
    LoadedFiles.set([mockFile])
    ;(resumeAudioContext as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(playSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSource)
  })

  it('sets Playing to false when called', async () => {
    Playing.set(true) // Start with playing state

    await playFile(0)

    expect(Playing.ref()).toBe(false)
  })

  it('sets the preview source in store after creating it', async () => {
    await playFile(0)

    expect(PreviewSource.ref()).toBe(mockSource)
  })

  it('sets PlayStartTimestamp and PlayDuration after starting playback', async () => {
    await playFile(0)

    expect(PlayStartTimestamp.ref()).not.toBe(null)
    expect(PlayDuration.ref()).toBe(calculateDuration(mockFile.samples[0].length))
    expect(PlayDuration.ref()).toBe(1) // 1 second
  })

  it('calculates duration correctly for different file lengths', async () => {
    const mockFile2 = {
      ...mockFile,
      name: 'test-file-2',
      samples: [new Float32Array(88200), new Float32Array(88200)] as [Float32Array, Float32Array], // 2 seconds
    }
    LoadedFiles.set([mockFile, mockFile2])

    await playFile(1)

    const expectedDuration = calculateDuration(mockFile2.samples[0].length)
    expect(PlayDuration.ref()).toBe(expectedDuration)
    expect(PlayDuration.ref()).toBe(2) // 2 seconds
  })

  it('handles file with zero samples', async () => {
    const emptyFile = {
      ...mockFile,
      samples: [new Float32Array(0), new Float32Array(0)] as [Float32Array, Float32Array],
    }
    LoadedFiles.set([emptyFile])

    await playFile(0)

    expect(PlayDuration.ref()).toBe(0)
    expect(PlayStartTimestamp.ref()).not.toBe(null)
  })

  it('sets timestamp to current time when starting playback', async () => {
    const beforeTime = Date.now()
    await playFile(0)
    const afterTime = Date.now()

    const timestamp = PlayStartTimestamp.ref()
    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })
})
