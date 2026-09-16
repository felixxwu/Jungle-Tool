import {
  BPM,
  FillGaps,
  Layers,
  NoteFadeOut,
  NoteLength,
  NumBars,
  Saturation,
  ShortenNotes,
  Swing,
  Arrangement,
} from '../lib/store'
import type { ArrangementState } from '../lib/types'

export const getCurrentArrangementState = (): ArrangementState => ({
  bpm: BPM.ref(),
  swing: Swing.ref(),
  noteLength: NoteLength.ref(),
  noteFadeOut: NoteFadeOut.ref(),
  saturation: Saturation.ref(),
  layers: Layers.ref(),
  numBars: NumBars.ref(),
  arrangement: Arrangement.ref(),
  fillGaps: FillGaps.ref(),
  shortenNotes: ShortenNotes.ref(),
})

export const applyArrangementState = (state: ArrangementState) => {
  BPM.set(state.bpm)
  Swing.set(state.swing)
  NoteLength.set(state.noteLength)
  NoteFadeOut.set(state.noteFadeOut)
  Saturation.set(state.saturation)
  Layers.set(state.layers)
  NumBars.set(state.numBars)
  Arrangement.set(state.arrangement)
  FillGaps.set(state.fillGaps)
  ShortenNotes.set(state.shortenNotes)
}
