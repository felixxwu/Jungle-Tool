import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playSlice } from './playSlice'
import { LoadedFiles, PreviewSource, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'
import { playSamples } from '../lib/audio'
import { resumeAudioContext } from '../lib/audioContext'
import { getSliceSamples } from '../helpers/getSliceSamples'
import { calculateDuration } from '../lib/playback'

vi.mock('../lib/audio')
vi.mock('../lib/audioContext')
vi.mock('../helpers/getSliceSamples')

describe('playSlice', () => {
  const mockFile = {
    name: 'test-file',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [
      { start: 1000, type: 'Kick' as const, stepNum: 0 },
      { start: 5000, type: 'Snare' as const, stepNum: 4 },
      { start: 10000, type: 'Hat' as const, stepNum: 8 },
    ],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockSliceSamples: [Float32Array, Float32Array] = [
    new Float32Array(5000), // Slice samples
    new Float32Array(5000),
  ]

  const mockSource = {
    loop: false,
    onended: null as (() => void) | null,
    stop: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([mockFile])
    Playing.set(false)
    PlayStartTimestamp.set(null)
    PlayDuration.set(null)
    PreviewSource.set(null)
    ;(resumeAudioContext as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(playSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSource)
    ;(getSliceSamples as ReturnType<typeof vi.fn>).mockReturnValue(mockSliceSamples)
  })

  it('previews a slice by playing it', async () => {
    await playSlice(0, 0) // Play first slice

    expect(getSliceSamples).toHaveBeenCalledWith(mockFile, 0)
    expect(playSamples).toHaveBeenCalledWith(mockSliceSamples)
    expect(PreviewSource.ref()).toBe(mockSource)
  })

  it('sets Playing to false when called', async () => {
    Playing.set(true)

    await playSlice(0, 0)

    expect(Playing.ref()).toBe(false)
  })

  it('calculates duration based on slice samples length', async () => {
    await playSlice(0, 0)

    const expectedDuration = calculateDuration(mockSliceSamples[0].length)
    expect(PlayDuration.ref()).toBe(expectedDuration)
  })

  it('sets PlayStartTimestamp when starting playback', async () => {
    const beforeTime = Date.now()
    await playSlice(0, 0)
    const afterTime = Date.now()

    const timestamp = PlayStartTimestamp.ref()
    expect(timestamp).not.toBe(null)
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
    expect(timestamp).toBeLessThanOrEqual(afterTime)
  })

  it('previews different slices correctly', async () => {
    await playSlice(0, 1) // Play second slice

    expect(getSliceSamples).toHaveBeenCalledWith(mockFile, 1)
    expect(playSamples).toHaveBeenCalled()
  })

  it('handles slice with zero length', async () => {
    const emptySliceSamples: [Float32Array, Float32Array] = [
      new Float32Array(0),
      new Float32Array(0),
    ]
    ;(getSliceSamples as ReturnType<typeof vi.fn>).mockReturnValue(emptySliceSamples)

    await playSlice(0, 0)

    expect(PlayDuration.ref()).toBe(0)
    expect(PlayStartTimestamp.ref()).not.toBe(null)
  })

  it('does not loop slice playback', async () => {
    await playSlice(0, 0)

    // Slices should not loop (unlike arrangement and trim)
    expect(playSamples).toHaveBeenCalledWith(mockSliceSamples)
    expect((playSamples as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBeUndefined()
  })
})
