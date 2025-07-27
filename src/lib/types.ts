export type SliceType = 'Kick' | 'Snare' | 'Hat' | 'Start' | 'End'
export type Slice = { start: number; type: SliceType }
export type Layer = { filename: string; volume: number }

export type LoadedFile = {
  name: string
  artist: string
  year: number
  samples: [Float64Array, Float64Array]
  slices: Slice[]
}
