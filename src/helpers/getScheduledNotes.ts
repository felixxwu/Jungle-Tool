import type { Layer, LoadedFile, Note } from '../lib/types'
import { getSliceIndexFromStepNum } from './getSliceIndexFromStepNum'
import { getStepSeconds } from './getStepSeconds'

export type ScheduledNote = {
  filename: string
  layerKey: string
  sliceIndex: number
  timeInSeconds: number
  playbackRate: number
  fadeStartSeconds: number | null
  fadeEndSeconds: number | null
  // Fill Gaps doubles a slice's buffer (original + reversed) with no regard
  // for how long the step actually is, so left unbounded it can ring into
  // the next step's onset. This is the time at which it must be cut off:
  // the swing-adjusted position of the file's next ACTUAL slice, not just
  // "one step later" -- a stepNum the file has no slice for (e.g. a break
  // that skips step 1) lets the previous slice bleed through it instead of
  // being cut off early, and on a swing-delayed step a flat step distance
  // would land past the following (non-delayed) step's own onset and still
  // bleed into it.
  stopAtSeconds: number | null
}

/**
 * Pure planning core: decides what plays and when, with no audio types.
 *
 * Layer volume is deliberately absent. It lives on the layer GainNode so it
 * can affect notes that are already sounding, and so the live and offline
 * paths apply it identically.
 */
export const getScheduledNotes = (p: {
  fromStep: number
  toStep: number
  bpm: number
  swing: number
  layers: Layer[]
  loadedFiles: LoadedFile[]
  arrangement: Note[]
  noteLength: number
  noteFadeOut: number
  shortenNotes: boolean
  fillGaps: boolean
}): ScheduledNote[] => {
  const stepSeconds = getStepSeconds(p.bpm)
  const swingOffset = (startStep: number) =>
    startStep % 2 === 0 ? 0 : (p.swing / 100) * stepSeconds

  const scheduled: ScheduledNote[] = []

  for (const [layerIndex, layer] of p.layers.entries()) {
    const loadedFile = p.loadedFiles.find(file => file.name === layer.filename)
    if (!loadedFile) continue

    const playbackRate = Math.pow(2, layer.pitch / 12)
    // Two layers can share a filename (the same break added twice at
    // different pitches), so the gain node is keyed by position, not name.
    const layerKey = `${layer.filename}#${layerIndex}`

    // Sorted once per layer so a slice's bleed length is measured against
    // its actual neighbour in the file, not an assumed one at stepNum + 1
    // -- a file that skips a stepNum (e.g. no slice at step 1) should let
    // the previous slice ring through that gap instead of being cut off as
    // if a slice were there.
    const sortedSlices = [...loadedFile.slices].sort((a, b) => a.stepNum - b.stepNum)

    for (const note of p.arrangement) {
      // Half-open range: a note on the exclusive bound belongs to the next
      // window, otherwise it would be scheduled twice.
      if (note.startStep < p.fromStep || note.startStep >= p.toStep) continue

      const sliceIndex = getSliceIndexFromStepNum(loadedFile, note.stepNumToPlay)
      if (sliceIndex === null) continue

      const timeInSeconds = note.startStep * stepSeconds + swingOffset(note.startStep)
      const fadeStartSeconds = p.shortenNotes ? timeInSeconds + p.noteLength / 1000 : null
      const fadeEndSeconds =
        fadeStartSeconds === null ? null : fadeStartSeconds + p.noteFadeOut / 1000
      // Bound to the position of the next ACTUAL slice in the file (falling
      // back to the end of the 16-step cycle if this is the last slice),
      // not just "one step later" -- and to its swing-adjusted position,
      // not a flat step distance, for the same reason as above.
      const sliceListIndex = sortedSlices.findIndex(s => s.stepNum === note.stepNumToPlay)
      const nextSliceStepNum = sortedSlices[sliceListIndex + 1]?.stepNum ?? 16
      const nextStep = note.startStep + (nextSliceStepNum - note.stepNumToPlay)
      const nextStepStart = nextStep * stepSeconds + swingOffset(nextStep)
      const stopAtSeconds = p.fillGaps ? nextStepStart : null

      scheduled.push({
        filename: layer.filename,
        layerKey,
        sliceIndex,
        timeInSeconds,
        playbackRate,
        fadeStartSeconds,
        fadeEndSeconds,
        stopAtSeconds,
      })
    }
  }

  return scheduled.sort((a, b) => a.timeInSeconds - b.timeInSeconds)
}
