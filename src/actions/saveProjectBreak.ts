import { WaveFile } from 'wavefile'
import { SAMPLE_RATE } from '../lib/consts'
import { callNative } from '../lib/plugin'
import type { LoadedFile } from '../lib/types'

// The break as a JSON file like the factory ones, with its audio as a normalised float WAV,
// so reloading it never changes its level.
const breakJson = (file: LoadedFile) => {
  const wav = new WaveFile()
  wav.fromScratch(
    2,
    SAMPLE_RATE,
    '32f',
    file.samples.map(channel => Float32Array.from(channel, s => s / 32768))
  )
  return JSON.stringify({
    name: file.name,
    artist: file.artist,
    year: file.year,
    base64: wav.toBase64(),
    slices: file.slices,
  })
}

// An imported break is saved inside the DAW project, so the project carries its own copy.
export const saveProjectBreak = (file: LoadedFile) =>
  callNative('addProjectBreak', file.name, breakJson(file), true)

// Plays an import through the plugin while it's being trimmed, without saving it in the project yet.
export const sendUnsavedBreak = (file: LoadedFile) =>
  callNative('addProjectBreak', file.name, breakJson(file), false)
