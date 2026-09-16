import { describe, it, expect, beforeEach } from 'vitest'
import { renderOffline } from './offlineRender'
import { clearSliceBufferCache } from './audioBuffers'
import { Arrangement, BPM, FillGaps, Layers, LoadedFiles, NumBars, Saturation, ShortenNotes, Swing } from './store'
import type { LoadedFile } from './types'

const loudFile: LoadedFile = {
  name: 'Loud',
  artist: 'Test',
  year: 1969,
  samples: [
    Float32Array.from({ length: 44100 }, () => 32000),
    Float32Array.from({ length: 44100 }, () => 32000),
  ],
  slices: [{ start: 0, type: 'Kick', stepNum: 0 }],
  whosampledLink: '',
  whosampledCount: 0,
}

const peak = (buffer: AudioBuffer) => {
  let max = 0
  for (const sample of buffer.getChannelData(0)) max = Math.max(max, Math.abs(sample))
  return max
}

describe('renderOffline (real OfflineAudioContext)', () => {
  beforeEach(() => {
    clearSliceBufferCache()
    LoadedFiles.set([loudFile])
    Layers.set([{ filename: 'Loud', volume: 100, pitch: 0 }])
    Arrangement.set([{ stepNumToPlay: 0, startStep: 0 }])
    BPM.set(120)
    Swing.set(0)
    NumBars.set(1)
    Saturation.set(0)
    FillGaps.set(false)
    ShortenNotes.set(false)
  })

  it('never exceeds full scale', async () => {
    const buffer = await renderOffline()
    expect(peak(buffer)).toBeLessThanOrEqual(1)
  })

  it('renders at the exact arrangement length', async () => {
    const buffer = await renderOffline()
    expect(buffer.length).toBe(Math.round((60 / 120 / 4) * 44100 * 16))
  })

  it('folds a tail that runs past the loop end back to the start', async () => {
    // A note on the last step of the bar, with a slice long enough to overrun it.
    Arrangement.set([{ stepNumToPlay: 0, startStep: 15 }])
    const buffer = await renderOffline()
    expect(Math.abs(buffer.getChannelData(0)[0])).toBeGreaterThan(0)
  })
})
