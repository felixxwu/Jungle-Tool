import { describe, it, expect, beforeEach } from 'vitest'
import { startScheduler, stopScheduler, tick, getLoopPosition } from './scheduler'
import { createFakeAudioContext } from '../test/audio-mock'
import { clearSliceBufferCache } from './audioBuffers'
import {
  Arrangement,
  BPM,
  FillGaps,
  Layers,
  LoadedFiles,
  NoteFadeOut,
  NoteLength,
  NumBars,
  Saturation,
  ShortenNotes,
  Swing,
} from './store'
import type { LoadedFile } from './types'

const loadedFile: LoadedFile = {
  name: 'Break',
  artist: 'Test',
  year: 1969,
  samples: [new Float32Array(4096), new Float32Array(4096)],
  slices: Array.from({ length: 16 }, (_, i) => ({
    start: i * 256,
    type: 'Kick' as const,
    stepNum: i,
  })),
  whosampledLink: '',
  whosampledCount: 0,
}

let ctx: ReturnType<typeof createFakeAudioContext>

beforeEach(async () => {
  await stopScheduler()
  clearSliceBufferCache()
  ctx = createFakeAudioContext()
  LoadedFiles.set([loadedFile])
  Layers.set([{ filename: 'Break', volume: 100, pitch: 0 }])
  Arrangement.set(Array.from({ length: 16 }, (_, i) => ({ stepNumToPlay: i, startStep: i })))
  BPM.set(120)
  Swing.set(0)
  NumBars.set(1)
  NoteLength.set(200)
  NoteFadeOut.set(10)
  Saturation.set(0)
  FillGaps.set(false)
  ShortenNotes.set(false)
})

describe('scheduler', () => {
  it('schedules only the notes inside the lookahead window', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    // At 120 BPM a step is 0.125 s, so a 0.1 s window covers step 0 only.
    expect(ctx.createdSources).toHaveLength(1)
  })

  it('schedules further notes as time advances', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    ctx.advance(0.125)
    tick()
    expect(ctx.createdSources.length).toBeGreaterThan(1)
  })

  it('does not schedule the same step twice', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    const before = ctx.createdSources.length
    tick()
    tick()
    expect(ctx.createdSources).toHaveLength(before)
  })

  it('picks up a grid edit without restarting', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    Arrangement.set([{ stepNumToPlay: 4, startStep: 8 }])
    // 0.95 s, not 0.9: the note sits at step 8 = 1.0 s and the lookahead
    // condition is strictly < horizon, so 0.9 would exclude it.
    ctx.advance(0.95)
    tick()
    const lastSource = ctx.createdSources[ctx.createdSources.length - 1]
    expect(lastSource.startedAt).toBeCloseTo(8 * 0.125, 6)
  })

  it('keeps the old tempo for the remainder of the pass after a BPM change', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    BPM.set(60)
    ctx.advance(0.125)
    tick()
    // Still the 120 BPM grid: step 1 sits at 0.125 s, not 0.25 s.
    expect(ctx.createdSources[1].startedAt).toBeCloseTo(0.125, 6)
  })

  it('applies the new tempo from the next pass', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    BPM.set(60)
    // Run out the 2 s pass so the next one is snapshotted at 60 BPM.
    for (let i = 0; i < 20; i++) {
      ctx.advance(0.125)
      tick()
    }
    const passTwoStart = ctx.createdSources.find(s => (s.startedAt ?? 0) >= 2)
    expect(passTwoStart?.startedAt).toBeCloseTo(2, 6)
  })

  it('schedules nothing while there are no layers', () => {
    Layers.set([])
    startScheduler(ctx as unknown as BaseAudioContext)
    expect(ctx.createdSources).toHaveLength(0)
  })

  it('never reports a negative loop position, including across the boundary', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    for (let i = 0; i < 40; i++) {
      ctx.advance(0.05)
      tick()
      const position = getLoopPosition()
      expect(position).not.toBeNull()
      expect(position!.fraction).toBeGreaterThanOrEqual(0)
      expect(position!.fraction).toBeLessThan(1)
    }
  })

  it('advances the loop position monotonically within a pass', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    const first = getLoopPosition()!.fraction
    ctx.advance(0.5)
    tick()
    expect(getLoopPosition()!.fraction).toBeGreaterThan(first)
  })
})
