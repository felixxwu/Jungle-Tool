export type File = {
  path: string
  name: string
  artist: string
  year: number
}

export type SliceType = 'Kick' | 'Snare' | 'Hat'
export type Slice = { start: number; type: SliceType }

export type LoadedFile = File & {
  samples: [Float64Array, Float64Array]
  slices: Slice[]
}
