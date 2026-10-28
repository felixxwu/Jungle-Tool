import type { Note } from '../lib/types'

const ticksPerStep = 240

// A Standard MIDI File of the arrangement that the plugin's MIDI mode plays back identically.
export const arrangementToMidi = (arrangement: Note[], numBars: number, swing: number) => {
  const swingTicks = Math.round((swing / 100) * ticksPerStep)
  const clipEnd = numBars * 16 * ticksPerStep
  const notes = arrangement
    .map(note => ({
      pitch: 36 + note.stepNumToPlay,
      start: note.startStep * ticksPerStep + (note.startStep % 2 === 1 ? swingTicks : 0),
    }))
    .sort((a, b) => a.start - b.start)

  // Many DAWs merge overlapping notes of the same pitch, so a note ends where the next one starts.
  const events = notes.flatMap((note, i) => {
    const next = notes.slice(i + 1).find(n => n.pitch === note.pitch)
    const end = Math.min(note.start + ticksPerStep, next?.start ?? Infinity, clipEnd)
    return [
      { tick: note.start, bytes: [0x90, note.pitch, 100] },
      { tick: end, bytes: [0x80, note.pitch, 0] },
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
