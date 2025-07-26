import { WaveFile } from 'wavefile'
import { LoadedFiles } from '../lib/store'

export const loadJson = (jsonString: string) => {
  const json = JSON.parse(jsonString)

  const wavefile = new WaveFile()
  wavefile.fromBase64(json.base64)
  const samples = wavefile.getSamples()
  const left = samples[0] as unknown as Float64Array
  const right = samples[1] as unknown as Float64Array

  LoadedFiles.ref().push({
    path: json.name,
    name: json.name,
    artist: json.artist,
    year: json.year,
    samples: [left, right],
    slices: json.slices,
  })
  LoadedFiles.set([...LoadedFiles.ref()])
}
