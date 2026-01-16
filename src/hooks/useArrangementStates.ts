import {
  Arrangement,
  BPM,
  Layers,
  LoadedFiles,
  NumBars,
  Swing,
  NoteLength,
  NoteFadeOut,
  Saturation,
  FillGaps,
} from '../lib/store'

/**
 * Subscribes to all states that affect arrangement generation.
 * This ensures components re-render when any arrangement-affecting state changes.
 */
export const useArrangementStates = () => {
  Arrangement.useState()
  LoadedFiles.useState()
  BPM.useState()
  Layers.useState()
  Swing.useState()
  NumBars.useState()
  NoteLength.useState()
  NoteFadeOut.useState()
  Saturation.useState()
  FillGaps.useState()
}

/**
 * Returns all arrangement-affecting states as values.
 * Used for comparison in useRestartPlayback.
 */
export const useArrangementStateValues = () => {
  return {
    arrangement: Arrangement.useState(),
    layers: Layers.useState(),
    bpm: BPM.useState(),
    swing: Swing.useState(),
    noteLength: NoteLength.useState(),
    noteFadeOut: NoteFadeOut.useState(),
    saturation: Saturation.useState(),
    fillGaps: FillGaps.useState(),
  }
}
