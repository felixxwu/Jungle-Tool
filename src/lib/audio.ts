import { WaveFile } from 'wavefile'
import { Tone } from './tone'
import { max } from '../helpers/max'
import { SAMPLE_RATE } from './consts'

export const fetchFile = async (path: string) => {
  const response = await fetch(path)
  const arrayBuffer = await response.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)
  const wavefile = new WaveFile()
  wavefile.fromBuffer(uint8Array)
  const samples = wavefile.getSamples()
  const left = samples[0] as unknown as Float32Array
  const right = samples[1] as unknown as Float32Array
  return [left, right] as const satisfies [Float32Array, Float32Array]
}

export const createPlayer = async (samples: [Float32Array, Float32Array]) => {
  const wavefile = new WaveFile()
  wavefile.fromScratch(2, SAMPLE_RATE, '16', samples)
  const buffer = await new Tone.Player().context.decodeAudioData(
    wavefile.toBuffer().buffer as ArrayBuffer
  )
  return new Tone.Player(buffer).toDestination()
}

export const mono = (samples?: [Float32Array, Float32Array]) => {
  if (!samples) return new Float32Array(0)

  const left = samples[0]
  const right = samples[1]
  const mono = new Float32Array(left.length)
  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2
  }
  return mono
}

export const normalize = (samples: [Float32Array, Float32Array]) => {
  const left = samples[0]
  const right = samples[1]
  const maxLeft = max(left)
  const maxRight = max(right)
  const maxNum = Math.max(maxLeft, maxRight)
  const gain = (Math.pow(2, 15) - 1) / maxNum
  return [left.map(sample => sample * gain), right.map(sample => sample * gain)] as [
    Float32Array,
    Float32Array
  ]
}
export const gain = (samples: Float32Array, gain: number) => {
  return samples.map(sample => sample * gain)
}

export const normalizeMono = (samples: Float32Array) => {
  const max = Math.max(...samples)
  return gain(samples, 1 / max)
}

export const stereoSlice = (samples: [Float32Array, Float32Array], start: number, end: number) => {
  const left = samples[0].slice(start, end)
  const right = samples[1].slice(start, end)

  if (start < 0) {
    const padding = new Float32Array(Math.abs(start))
    return [
      new Float32Array([...padding, ...left]),
      new Float32Array([...padding, ...right]),
    ] as const satisfies [Float32Array, Float32Array]
  }

  if (end > samples[0].length) {
    const padding = new Float32Array(end - samples[0].length)
    return [
      new Float32Array([...left, ...padding]),
      new Float32Array([...right, ...padding]),
    ] as const satisfies [Float32Array, Float32Array]
  }

  return [left, right] as const satisfies [Float32Array, Float32Array]
}

export const sineSaturation = (
  samples: Float32Array,
  mix: number, // %
  preGain: number // db
) => {
  const result = new Float32Array(samples.length)

  const linearGain = Math.pow(10, preGain / 20)
  const maxValue = Math.pow(2, 15)

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    const clippedSample = Math.max(-maxValue, Math.min(maxValue, sample * linearGain))
    const x = (clippedSample * Math.PI) / 2
    const y = Math.sin(x / maxValue) * maxValue
    result[i] = y * (mix / 100) + sample * (1 - mix / 100)
  }

  return result
}

export const sineSaturationStereo = (
  samples: [Float32Array, Float32Array],
  mix: number, // %
  preGain: number // db
) => {
  const left = samples[0]
  const right = samples[1]
  return [sineSaturation(left, mix, preGain), sineSaturation(right, mix, preGain)] as [
    Float32Array,
    Float32Array
  ]
}
