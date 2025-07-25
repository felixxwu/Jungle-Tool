export type File = {
  path: string
  name: string
  artist: string
  year: number
}

export type LoadedFile = File & {
  samples: [Float64Array, Float64Array]
}
