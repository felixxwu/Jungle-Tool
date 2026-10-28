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

// The plugin keeps imported breaks on disk and in the project, so they come back after a restart.
export const saveUserBreak = (
  file: LoadedFile,
  trim: { start: number; end: number } | null,
  id = ''
) =>
  callNative(
    'saveUserBreak',
    id,
    file.name,
    trim?.start ?? null,
    trim?.end ?? null,
    breakJson(file),
    true
  )

// Plays an import through the plugin while it's being trimmed, without saving it anywhere yet.
export const sendUnsavedBreak = (file: LoadedFile) =>
  callNative('saveUserBreak', '', file.name, null, null, breakJson(file), false)
