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
