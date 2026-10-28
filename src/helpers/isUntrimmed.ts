import type { LoadedFile } from '../lib/types'

// A freshly imported WAV keeps its Start/End markers until the user trims it.
export const isUntrimmed = (file: LoadedFile) =>
  file.slices.some(slice => slice.type === 'Start' || slice.type === 'End')
