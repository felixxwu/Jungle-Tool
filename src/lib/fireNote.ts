import type { ScheduledNote } from '../helpers/getScheduledNotes'
import { getSliceBuffer } from './audioBuffers'
import type { Graph } from './graph'
import type { LoadedFile } from './types'

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

  if (p.note.fadeStartSeconds !== null && p.note.fadeEndSeconds !== null) {
    noteGain.gain.setValueAtTime(1, p.passStartTime + p.note.fadeStartSeconds)
    noteGain.gain.linearRampToValueAtTime(0, p.passStartTime + p.note.fadeEndSeconds)
    source.stop(p.passStartTime + p.note.fadeEndSeconds)
  }
}
