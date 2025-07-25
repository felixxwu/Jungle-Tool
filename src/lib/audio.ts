import { WaveFile } from 'wavefile'
import { Tone } from './tone'

export const fetchFile = async (path: string) => {
  const response = await fetch(path)
  const arrayBuffer = await response.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)
  const wavefile = new WaveFile()
  wavefile.fromBuffer(uint8Array)
  const samples = wavefile.getSamples()
  const left = samples[0] as unknown as Float64Array
  const right = samples[1] as unknown as Float64Array
  return [left, right] as const satisfies [Float64Array, Float64Array]
}

export const createPlayer = async (samples: [Float64Array, Float64Array]) => {
  const wavefile = new WaveFile()
  wavefile.fromScratch(2, 44100, '16', samples)
  const buffer = await new Tone.Player().context.decodeAudioData(wavefile.toBuffer().buffer)
  return new Tone.Player(buffer).toDestination()
}

export const mono = (samples?: [Float64Array, Float64Array]) => {
  if (!samples) return new Float64Array(0)

  const left = samples[0]
  const right = samples[1]
  const mono = new Float64Array(left.length)
  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2
  }
  return mono
}

export const normalize = (samples: [Float64Array, Float64Array]) => {
  const left = samples[0]
  const right = samples[1]
  const max = Math.max(Math.max(...left), Math.max(...right))
  const gain = (Math.pow(2, 15) - 1) / max
  return [left.map(sample => sample * gain), right.map(sample => sample * gain)] as [
    Float64Array,
    Float64Array
  ]
}

export const normalizeMono = (samples: Float64Array) => {
  const max = Math.max(...samples)
  return samples.map(sample => sample / max)
}
