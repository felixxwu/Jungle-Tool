import { WaveFile } from 'wavefile'
import { LoadedFiles, SelectedFileIndex } from '../lib/store'
import { normalize } from '../lib/audio'

export const loadJson = (jsonString: string) => {
  const json = JSON.parse(jsonString)

  const wavefile = new WaveFile()
  wavefile.fromBase64(json.base64)
  const samples = wavefile.getSamples()
  const left = samples[0] as unknown as Float32Array
  const right = samples[1] as unknown as Float32Array

  const normalisedSamples = normalize([left, right])

  // const slices = json.slices.map((slice: Slice) => ({
  //   ...slice,
  //   start: findClosestZeroCrossing(mono(normalisedSamples), slice.start),
  // }))

  LoadedFiles.ref().push({
    name: json.name,
    artist: json.artist,
    year: json.year,
    samples: normalisedSamples,
    slices: json.slices,
    whosampledLink: json.whosampledLink,
    whosampledCount: json.whosampledCount,
  })
  LoadedFiles.set([...LoadedFiles.ref()])
  SelectedFileIndex.set(LoadedFiles.ref().length - 1)
}
