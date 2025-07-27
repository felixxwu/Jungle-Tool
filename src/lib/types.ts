export type SliceType = 'Kick' | 'Snare' | 'Hat' | 'Start' | 'End'
export type Slice = { start: number; type: SliceType; stepNum: number }
export type Layer = { filename: string; volume: number }
export type Note = { stepNumToPlay: number; startStep: number }

export type LoadedFile = {
  name: string
  artist: string
  year: number
  samples: [Float64Array, Float64Array]
  slices: Slice[]
}
