import type { Note } from '../lib/types'

const ticksPerStep = 240

// A Standard MIDI File of the arrangement that the plugin's MIDI mode plays back identically.
export const arrangementToMidi = (arrangement: Note[], numBars: number, swing: number) => {
  const swingTicks = Math.round((swing / 100) * ticksPerStep)
  const clipEnd = numBars * 16 * ticksPerStep
  const stepTick = (step: number) => step * ticksPerStep + (step % 2 === 1 ? swingTicks : 0)

  // Each note lasts until the next step starts on the swing grid, so swung notes neither leave
  // gaps nor overlap the next one.
  const events = arrangement.flatMap(note => {
    const start = stepTick(note.startStep)
    const end = Math.min(stepTick(note.startStep + 1), clipEnd)
    return [
      { tick: start, bytes: [0x90, 36 + note.stepNumToPlay, 100] },
      { tick: end, bytes: [0x80, 36 + note.stepNumToPlay, 0] },
    ]
  })
  events.push({ tick: clipEnd, bytes: [0xff, 0x2f, 0x00] })
  // Note-offs first at the same tick, so a note ending where its repeat starts doesn't cut the repeat.
  events.sort((a, b) => a.tick - b.tick || a.bytes[0] - b.bytes[0])

  const track: number[] = []
  let tick = 0
  for (const event of events) {
    track.push(...variableLength(event.tick - tick), ...event.bytes)
    tick = event.tick
  }

  return new Uint8Array([
    ...ascii('MThd'),
    ...uint32(6),
    ...uint16(0),
    ...uint16(1),
    ...uint16(ticksPerStep * 4),
    ...ascii('MTrk'),
    ...uint32(track.length),
    ...track,
  ])
}

const ascii = (text: string) => [...text].map(c => c.charCodeAt(0))
const uint16 = (n: number) => [(n >> 8) & 0xff, n & 0xff]
const uint32 = (n: number) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]

const variableLength = (n: number) => {
  const bytes = [n & 0x7f]
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80)
  return bytes
}
