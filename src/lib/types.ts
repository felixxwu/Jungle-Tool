export type SliceType = 'Kick' | 'Snare' | 'Hat' | 'Start' | 'End'
export type Slice = { start: number; type: SliceType; stepNum: number }
export type Layer = { filename: string; volume: number; pitch: number; temp?: boolean }
export type Note = { stepNumToPlay: number; startStep: number }
export type ITab = 'arrangement' | 'layers' | 'library'
export type ZeroCrossingSearch = 'forward' | 'backward' | 'bidirectional'

export type LoadedFile = {
  name: string
  artist: string
  year: number
  samples: [Float32Array, Float32Array]
  slices: Slice[]
  whosampledLink: string
  whosampledCount: number
}

export type ArrangementState = {
  bpm: number
  swing: number
  noteLength: number
  noteFadeOut: number
  saturation: number
  layers: Layer[]
  numBars: number
  arrangement: Note[]
  fillGaps: boolean
  shortenNotes: boolean
}

export type SavedArrangement = {
  id: string
  name: string
  updatedAt: number
  state: ArrangementState
}
