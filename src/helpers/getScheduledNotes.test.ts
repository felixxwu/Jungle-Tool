import { describe, it, expect } from 'vitest'
import { getScheduledNotes } from './getScheduledNotes'
import type { Layer, LoadedFile, Note } from '../lib/types'

const file: LoadedFile = {
  name: 'Break',
  artist: 'Test',
  year: 1969,
  samples: [new Float32Array(1024), new Float32Array(1024)],
  slices: [
    { start: 0, type: 'Kick', stepNum: 0 },
    { start: 256, type: 'Snare', stepNum: 1 },
    { start: 512, type: 'Hat', stepNum: 2 },
  ],
  whosampledLink: '',
  whosampledCount: 0,
}

const layer: Layer = { filename: 'Break', volume: 100, pitch: 0 }

const notes: Note[] = [
  { stepNumToPlay: 0, startStep: 0 },
  { stepNumToPlay: 1, startStep: 1 },
  { stepNumToPlay: 2, startStep: 2 },
]

const base = {
  fromStep: 0,
  toStep: 16,
  bpm: 120,
  swing: 0,
  layers: [layer],
  loadedFiles: [file],
  arrangement: notes,
  noteLength: 200,
  noteFadeOut: 10,
  shortenNotes: false,
}

describe('getScheduledNotes', () => {
  it('places notes on the step grid', () => {
    const result = getScheduledNotes(base)
    expect(result).toHaveLength(3)
    expect(result[0].timeInSeconds).toBeCloseTo(0, 10)
    expect(result[1].timeInSeconds).toBeCloseTo(0.125, 10)
    expect(result[2].timeInSeconds).toBeCloseTo(0.25, 10)
  })

  it('only returns notes in the half-open step range', () => {
    const result = getScheduledNotes({ ...base, fromStep: 1, toStep: 2 })
    expect(result).toHaveLength(1)
    expect(result[0].sliceIndex).toBe(1)
  })

  it('excludes a note exactly on the exclusive upper bound', () => {
    const result = getScheduledNotes({ ...base, fromStep: 0, toStep: 2 })
    expect(result.map(n => n.sliceIndex)).toEqual([0, 1])
  })

  it('delays odd steps by the swing amount', () => {
    const result = getScheduledNotes({ ...base, swing: 50 })
    expect(result[0].timeInSeconds).toBeCloseTo(0, 10)
    expect(result[1].timeInSeconds).toBeCloseTo(0.125 + 0.0625, 10)
    expect(result[2].timeInSeconds).toBeCloseTo(0.25, 10)
  })

  it('converts layer pitch to a playback rate', () => {
    const up = getScheduledNotes({ ...base, layers: [{ ...layer, pitch: 12 }] })
    const down = getScheduledNotes({ ...base, layers: [{ ...layer, pitch: -12 }] })
    expect(up[0].playbackRate).toBeCloseTo(2, 10)
    expect(down[0].playbackRate).toBeCloseTo(0.5, 10)
  })

  it('emits one note per layer', () => {
    const second: Layer = { filename: 'Break', volume: 50, pitch: 7 }
    const result = getScheduledNotes({ ...base, layers: [layer, second] })
    expect(result).toHaveLength(6)
  })

  it('gives two layers of the same break distinct layer keys', () => {
    const second: Layer = { filename: 'Break', volume: 50, pitch: 7 }
    const result = getScheduledNotes({ ...base, layers: [layer, second] })
    expect(new Set(result.map(n => n.layerKey))).toEqual(new Set(['Break#0', 'Break#1']))
  })

  it('skips layers whose file is not loaded', () => {
    const missing: Layer = { filename: 'Nope', volume: 100, pitch: 0 }
    expect(getScheduledNotes({ ...base, layers: [missing] })).toHaveLength(0)
  })

  it('skips notes whose stepNumToPlay has no matching slice', () => {
    const result = getScheduledNotes({
      ...base,
      arrangement: [{ stepNumToPlay: 9, startStep: 0 }],
    })
    expect(result).toHaveLength(0)
  })

  it('leaves fade times null when shorten notes is off', () => {
    const result = getScheduledNotes(base)
    expect(result[0].fadeStartSeconds).toBeNull()
    expect(result[0].fadeEndSeconds).toBeNull()
  })

  it('sets fade times relative to the note start when shorten notes is on', () => {
    const result = getScheduledNotes({
      ...base,
      shortenNotes: true,
      noteLength: 100,
      noteFadeOut: 50,
    })
    expect(result[1].fadeStartSeconds).toBeCloseTo(0.125 + 0.1, 10)
    expect(result[1].fadeEndSeconds).toBeCloseTo(0.125 + 0.15, 10)
  })
})
