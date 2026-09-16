import { describe, it, expect } from 'vitest'
import { fireNote } from './fireNote'
import { buildGraph } from './graph'
import { clearSliceBufferCache } from './audioBuffers'
import { createFakeAudioContext } from '../test/audio-mock'
import type { ScheduledNote } from '../helpers/getScheduledNotes'
import type { LoadedFile } from './types'

const loadedFile: LoadedFile = {
  name: 'Break',
  artist: 'Test',
  year: 1969,
  samples: [new Float32Array(1024), new Float32Array(1024)],
  slices: [
    { start: 0, type: 'Kick', stepNum: 0 },
    { start: 512, type: 'Snare', stepNum: 1 },
  ],
  whosampledLink: '',
  whosampledCount: 0,
}

const note: ScheduledNote = {
  filename: 'Break',
  layerKey: 'Break#0',
  sliceIndex: 0,
  timeInSeconds: 0.25,
  playbackRate: 1.5,
  fadeStartSeconds: null,
  fadeEndSeconds: null,
  stopAtSeconds: null,
}

const fire = (overrides: Partial<ScheduledNote>) => {
  clearSliceBufferCache()
  const ctx = createFakeAudioContext()
  const graph = buildGraph(ctx as unknown as BaseAudioContext)
  fireNote({
    ctx: ctx as unknown as BaseAudioContext,
    graph,
    note: { ...note, ...overrides },
    loadedFile,
    fillGaps: false,
    passStartTime: 10,
  })
  return ctx
}

describe('fireNote', () => {
  it('starts the source at the pass start plus the note offset', () => {
    const ctx = fire({})
    expect(ctx.createdSources[0].startedAt).toBeCloseTo(10.25, 10)
  })

  it('applies the playback rate', () => {
    const ctx = fire({})
    expect(ctx.createdSources[0].playbackRate.value).toBeCloseTo(1.5, 10)
  })

  it('schedules no envelope when fade times are null', () => {
    const ctx = fire({})
    const noteGain = ctx.createdGains[ctx.createdGains.length - 1]
    expect(noteGain.gain.calls).toHaveLength(0)
    expect(ctx.createdSources[0].stoppedAt).toBeNull()
  })

  it('ramps down and stops the source when fade times are set', () => {
    const ctx = fire({ fadeStartSeconds: 0.35, fadeEndSeconds: 0.4 })
    const noteGain = ctx.createdGains[ctx.createdGains.length - 1]
    expect(noteGain.gain.calls).toEqual([
      { method: 'setValueAtTime', value: 1, time: 10.35 },
      { method: 'linearRampToValueAtTime', value: 0, time: 10.4 },
    ])
    expect(ctx.createdSources[0].stoppedAt).toBeCloseTo(10.4, 10)
  })

  it('declicks and stops at the fill-gaps step boundary when no fade is set', () => {
    const ctx = fire({ stopAtSeconds: 0.5 })
    const noteGain = ctx.createdGains[ctx.createdGains.length - 1]
    expect(noteGain.gain.calls).toEqual([
      { method: 'setValueAtTime', value: 1, time: 10.5 - 0.005 },
      { method: 'linearRampToValueAtTime', value: 0, time: 10.5 },
    ])
    expect(ctx.createdSources[0].stoppedAt).toBeCloseTo(10.5, 10)
  })

  it('stops at whichever of the fade end or the fill-gaps boundary comes first', () => {
    // fill-gaps boundary (0.4) is tighter than the shorten-notes fade end (0.6)
    const tighterFillGaps = fire({
      fadeStartSeconds: 0.3,
      fadeEndSeconds: 0.6,
      stopAtSeconds: 0.4,
    })
    expect(tighterFillGaps.createdSources[0].stoppedAt).toBeCloseTo(10.4, 10)

    // shorten-notes fade end (0.35) is tighter than the fill-gaps boundary (0.6)
    const tighterFade = fire({
      fadeStartSeconds: 0.3,
      fadeEndSeconds: 0.35,
      stopAtSeconds: 0.6,
    })
    expect(tighterFade.createdSources[0].stoppedAt).toBeCloseTo(10.35, 10)
  })
})
