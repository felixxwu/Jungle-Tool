import { useEffect } from 'react'
import { recordHistory } from '../lib/history'
import {
  Arrangement,
  BPM,
  FillGaps,
  Layers,
  NoteFadeOut,
  NoteLength,
  NumBars,
  ReplaceLayerIndex,
  Saturation,
  ShortenNotes,
  Swing,
} from '../lib/store'

// Records an undo step once things have been still for a moment, so a slider drag or a randomise
// is a single step.
export const HistoryRecorder = () => {
  const values = [
    Arrangement.useState(),
    BPM.useState(),
    FillGaps.useState(),
    Layers.useState(),
    NoteFadeOut.useState(),
    NoteLength.useState(),
    NumBars.useState(),
    ReplaceLayerIndex.useState(),
    Saturation.useState(),
    ShortenNotes.useState(),
    Swing.useState(),
  ]

  useEffect(() => {
    const timeout = setTimeout(recordHistory, 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, values)

  return null
}
