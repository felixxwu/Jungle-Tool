import { describe, expect, it, beforeEach } from 'vitest'
import { WaveFile } from 'wavefile'
import { loadJson } from './loadJson'
import { LoadedFiles } from '../lib/store'

describe('loadJson with a 32-bit float WAV', () => {
  beforeEach(() => LoadedFiles.set([]))

  it('keeps the stored level instead of normalising again, and can be given a name', () => {
    const wav = new WaveFile()
    wav.fromScratch(2, 44100, '32f', [
      [0.25, -1.5],
      [0.5, 0],
    ])
    loadJson(
      JSON.stringify({ name: 'break.wav', base64: wav.toBase64(), slices: [] }),
      'break.wav (2)'
    )

    const file = LoadedFiles.ref()[0]
    expect(file.name).toBe('break.wav (2)')
    expect(Array.from(file.samples[0])).toEqual([0.25 * 32768, -1.5 * 32768])
    expect(Array.from(file.samples[1])).toEqual([0.5 * 32768, 0])
  })
})
