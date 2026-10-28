import { describe, expect, it, beforeEach } from 'vitest'
import { canRedo, canUndo, recordHistory, redo, resetHistory, undo } from './history'
import { BPM, Layers, ReplaceLayerIndex } from './store'
import { getCurrentArrangementState } from '../actions/arrangementState'

const setBpm = (bpm: number) => {
  BPM.set(bpm)
  recordHistory()
}

describe('history', () => {
  beforeEach(() => {
    ReplaceLayerIndex.set(null)
    Layers.set([{ filename: 'Apache', volume: 50, pitch: 0 }])
    BPM.set(160)
    resetHistory()
    recordHistory()
  })

  it('undoes and redoes changes in order', () => {
    setBpm(170)
    setBpm(175)

    undo()
    expect(BPM.ref()).toBe(170)
    undo()
    expect(BPM.ref()).toBe(160)
    expect(canUndo()).toBe(false)

    redo()
    redo()
    expect(BPM.ref()).toBe(175)
    expect(canRedo()).toBe(false)
  })

  it('ignores records that change nothing', () => {
    recordHistory()
    setBpm(170)
    recordHistory()
    undo()
    expect(BPM.ref()).toBe(160)
    expect(canUndo()).toBe(false)
  })

  it('drops the redo steps after a new change', () => {
    setBpm(170)
    undo()
    setBpm(150)
    expect(canRedo()).toBe(false)
    undo()
    expect(BPM.ref()).toBe(160)
  })

  it('leaves preview layers out of the history', () => {
    Layers.set([...Layers.ref(), { filename: 'Preview', volume: 50, pitch: 0, temp: true }])
    recordHistory()
    expect(canUndo()).toBe(false)
  })

  it("doesn't record while a layer is being replaced", () => {
    ReplaceLayerIndex.set(0)
    Layers.set([{ filename: 'Candidate', volume: 50, pitch: 0 }])
    recordHistory()
    expect(canUndo()).toBe(false)
  })

  it('keeps at most 100 steps', () => {
    for (let i = 0; i < 120; i++) setBpm(100 + i)
    let steps = 0
    while (canUndo()) {
      undo()
      steps++
    }
    expect(steps).toBe(100)
    expect(getCurrentArrangementState().bpm).toBe(119)
  })
})
