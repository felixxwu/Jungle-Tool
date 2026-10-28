import { describe, it, expect, beforeEach } from 'vitest'
import { WaveFile } from 'wavefile'
import { loadWav } from './loadWav'
import { LoadedFiles } from '../lib/store'

const oneSecondWav = (sampleRate: number) => {
  const wav = new WaveFile()
  const channel = new Int16Array(sampleRate).fill(1000)
  wav.fromScratch(2, sampleRate, '16', [channel, channel])
  return wav.toBuffer().buffer as ArrayBuffer
}

describe('loadWav sample rate', () => {
  beforeEach(() => {
    LoadedFiles.set([])
  })

  it('converts a 48 kHz import to 44.1 kHz so it plays at the right speed', () => {
    loadWav(oneSecondWav(48000), 'test.wav')
    const [left, right] = LoadedFiles.ref()[0].samples
    expect(left.length).toBe(44100)
    expect(right.length).toBe(44100)
  })

  it('leaves a 44.1 kHz import untouched', () => {
    loadWav(oneSecondWav(44100), 'test.wav')
    expect(LoadedFiles.ref()[0].samples[0].length).toBe(44100)
  })
})
