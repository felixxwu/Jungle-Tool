import { describe, expect, it } from 'vitest'
import { arrangementToMidi } from './arrangementToMidi'

type ParsedNote = { pitch: number; velocity: number; start: number; end: number }

const parse = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer)
  const text = (at: number) => String.fromCharCode(...bytes.slice(at, at + 4))
  expect(text(0)).toBe('MThd')
  expect(view.getUint16(8)).toBe(0)
  expect(view.getUint16(10)).toBe(1)
  const ticksPerQuarter = view.getUint16(12)
  expect(text(14)).toBe('MTrk')
  const end = 22 + view.getUint32(18)
  expect(end).toBe(bytes.length)

  const notes: ParsedNote[] = []
  const open: { [pitch: number]: ParsedNote } = {}
  let at = 22
  let tick = 0
  let trackEnd = -1
  while (at < end) {
    let delta = 0
    let byte
    do {
      byte = bytes[at++]
      delta = (delta << 7) | (byte & 0x7f)
    } while (byte & 0x80)
    tick += delta

    const status = bytes[at++]
    if (status === 0xff) {
      expect(bytes[at]).toBe(0x2f)
      trackEnd = tick
      at += 2
    } else if (status === 0x90) {
      open[bytes[at]] = { pitch: bytes[at], velocity: bytes[at + 1], start: tick, end: -1 }
      at += 2
    } else if (status === 0x80) {
      const note = open[bytes[at]]
      note.end = tick
      notes.push(note)
      delete open[bytes[at]]
      at += 2
    } else {
      throw new Error(`unexpected status ${status}`)
    }
  }
  expect(Object.keys(open)).toHaveLength(0)
  return { ticksPerQuarter, trackEnd, notes: notes.sort((a, b) => a.start - b.start) }
}

describe('arrangementToMidi', () => {
  it('writes note 36 + slice step at 240 ticks per step, velocity 100, one step long', () => {
    const midi = parse(
      arrangementToMidi(
        [
          { stepNumToPlay: 0, startStep: 0 },
          { stepNumToPlay: 4, startStep: 4 },
          { stepNumToPlay: 15, startStep: 30 },
        ],
        2,
        0
      )
    )

    expect(midi.ticksPerQuarter).toBe(960)
    expect(midi.notes).toEqual([
      { pitch: 36, velocity: 100, start: 0, end: 240 },
      { pitch: 40, velocity: 100, start: 960, end: 1200 },
      { pitch: 51, velocity: 100, start: 7200, end: 7440 },
    ])
  })

  it('covers every bar of the arrangement, even when the last bars are empty', () => {
    const midi = parse(arrangementToMidi([{ stepNumToPlay: 0, startStep: 0 }], 4, 0))
    expect(midi.trackEnd).toBe(4 * 16 * 240)
  })

  it('delays odd steps by the swing, rounded to the nearest tick', () => {
    const midi = parse(
      arrangementToMidi(
        [
          { stepNumToPlay: 1, startStep: 1 },
          { stepNumToPlay: 2, startStep: 2 },
        ],
        1,
        33
      )
    )
    expect(midi.notes.map(n => n.start)).toEqual([240 + 79, 480])
  })

  it('ends a note where its repeat starts, so the two never merge', () => {
    const midi = parse(
      arrangementToMidi(
        [
          { stepNumToPlay: 0, startStep: 1 },
          { stepNumToPlay: 0, startStep: 2 },
        ],
        1,
        50
      )
    )
    expect(midi.notes).toEqual([
      { pitch: 36, velocity: 100, start: 360, end: 480 },
      { pitch: 36, velocity: 100, start: 480, end: 840 },
    ])
  })

  it('ends a swung last note at the end of the clip', () => {
    const midi = parse(arrangementToMidi([{ stepNumToPlay: 0, startStep: 15 }], 1, 50))
    expect(midi.notes).toEqual([{ pitch: 36, velocity: 100, start: 3720, end: 3840 }])
    expect(midi.trackEnd).toBe(3840)
  })

  it('with swing, ends each note where the next step starts, so swung notes neither gap nor overlap', () => {
    const midi = parse(
      arrangementToMidi(
        [
          { stepNumToPlay: 0, startStep: 0 },
          { stepNumToPlay: 1, startStep: 1 },
          { stepNumToPlay: 2, startStep: 2 },
          { stepNumToPlay: 5, startStep: 5 },
        ],
        1,
        50
      )
    )
    expect(midi.notes).toEqual([
      { pitch: 36, velocity: 100, start: 0, end: 360 },
      { pitch: 37, velocity: 100, start: 360, end: 480 },
      { pitch: 38, velocity: 100, start: 480, end: 840 },
      { pitch: 41, velocity: 100, start: 1320, end: 1440 },
    ])
  })
})
