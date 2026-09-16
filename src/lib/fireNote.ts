import type { ScheduledNote } from '../helpers/getScheduledNotes'
import { getSliceBuffer } from './audioBuffers'
import type { Graph } from './graph'
import type { LoadedFile } from './types'

// How long before a hard stop (Fill Gaps' step boundary, or Shorten Notes
// with no fade of its own) to start ramping down, so the cutoff isn't an
// audible click.
const DECLICK_SECONDS = 0.005

/**
 * Turn one ScheduledNote into live nodes:
 *   source (playbackRate) -> note gain (shorten-notes ramp) -> layer gain
 */
export const fireNote = (p: {
  ctx: BaseAudioContext
  graph: Graph
  note: ScheduledNote
  loadedFile: LoadedFile
  fillGaps: boolean
  passStartTime: number
}) => {
  const buffer = getSliceBuffer({
    ctx: p.ctx,
    loadedFile: p.loadedFile,
    sliceIndex: p.note.sliceIndex,
    fillGaps: p.fillGaps,
  })

  const when = p.passStartTime + p.note.timeInSeconds

  // Resolve the layer gain first so the note gain is the last node created:
  // the tests identify it that way, and creating them the other way round
  // makes the layer gain the last one instead.
  const layerGain = p.graph.layerGain(p.note.layerKey)

  const noteGain = p.ctx.createGain()
  noteGain.connect(layerGain)

  const source = p.ctx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = p.note.playbackRate
  source.connect(noteGain)

  source.start(when)

  // Two independent upper bounds on how long the note may sound: Shorten
  // Notes' declared fade end, and Fill Gaps' step-boundary cutoff (see the
  // comment on ScheduledNote.stopAtSeconds). Whichever is tighter wins.
  const bounds = [p.note.fadeEndSeconds, p.note.stopAtSeconds].filter(
    (t): t is number => t !== null
  )
  if (bounds.length === 0) return

  const stopSeconds = Math.min(...bounds)
  // Shorten Notes' own fade start is honoured when it fits before the
  // effective stop; otherwise there's only room for a short declick ramp.
  const fadeStartSeconds =
    p.note.fadeStartSeconds !== null
      ? Math.min(p.note.fadeStartSeconds, stopSeconds - DECLICK_SECONDS)
      : stopSeconds - DECLICK_SECONDS

  noteGain.gain.setValueAtTime(1, p.passStartTime + fadeStartSeconds)
  noteGain.gain.linearRampToValueAtTime(0, p.passStartTime + stopSeconds)
  source.stop(p.passStartTime + stopSeconds)
}
