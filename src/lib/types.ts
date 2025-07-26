export type SliceType = 'Kick' | 'Snare' | 'Hat' | 'End'
export type Slice = { start: number; type: SliceType }

export type LoadedFile = {
  path: string
  name: string
  artist: string
  year: number
  samples: [Float64Array, Float64Array]
  slices: Slice[]
}
