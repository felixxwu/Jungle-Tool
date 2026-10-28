import { LoadedFiles, MissingBreaks } from '../lib/store'
import { stereoSlice } from '../lib/audio'
import { decodeWav } from './loadWav'
import { loadJson } from './loadJson'
import { saveUserBreak } from './saveUserBreak'
import type { MissingBreak } from '../lib/types'
import { pickFile } from '../lib/plugin'

// Re-imports a break the project uses but this machine doesn't have, the same way it was first
// imported (resample, normalise, then trim), so the project's saved slices line up again.
export const locateUserBreak = async (missing: MissingBreak) => {
  const file = await pickFile(missing.trimStart === null ? '*.json' : '*.wav')
  if (!file) return

  if (missing.trimStart === null || missing.trimEnd === null) {
    loadJson(new TextDecoder().decode(file.bytes), missing.name)
  } else {
    const samples = decodeWav(file.bytes)
    LoadedFiles.ref().push({
      name: missing.name,
      artist: '',
      year: 0,
      samples: stereoSlice(samples, missing.trimStart, missing.trimEnd),
      slices: [],
      whosampledLink: '',
      whosampledCount: 0,
    })
    LoadedFiles.set([...LoadedFiles.ref()])
  }

  MissingBreaks.set(MissingBreaks.ref().filter(b => b.id !== missing.id))
  const located = LoadedFiles.ref().find(f => f.name === missing.name)!
  saveUserBreak(
    located,
    missing.trimStart === null || missing.trimEnd === null
      ? null
      : { start: missing.trimStart, end: missing.trimEnd },
    missing.id
  )
}
