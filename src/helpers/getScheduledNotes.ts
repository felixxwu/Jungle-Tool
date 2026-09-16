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

      scheduled.push({
        filename: layer.filename,
        layerKey,
        sliceIndex,
        timeInSeconds,
        playbackRate,
        fadeStartSeconds,
        fadeEndSeconds,
      })
    }
  }

  return scheduled.sort((a, b) => a.timeInSeconds - b.timeInSeconds)
}
