import { loadJson } from './loadJson'
import { loadWav } from './loadWav'
import { LoadedFiles, MissingBreaks, Modal } from '../lib/store'
import { uniqueBreakName } from '../helpers/uniqueBreakName'
import { IS_PLUGIN, pickFile } from '../lib/plugin'
import { saveUserBreak } from './saveUserBreak'

const takenNames = () => [
  ...LoadedFiles.ref().map(f => f.name),
  ...MissingBreaks.ref().map(b => b.name),
]

const loadJsonImport = (text: string) => {
  loadJson(text, uniqueBreakName(JSON.parse(text).name, takenNames()))
  // A .json import is already sliced and has no trim step, so the plugin keeps it straight away.
  if (IS_PLUGIN) saveUserBreak(LoadedFiles.ref()[LoadedFiles.ref().length - 1], null)
}

const importInPlugin = async () => {
  const file = await pickFile('*.wav;*.json')
  if (!file) return
  try {
    if (file.name.toLowerCase().endsWith('.json')) {
      loadJsonImport(new TextDecoder().decode(file.bytes))
    } else {
      loadWav(file.bytes, uniqueBreakName(file.name, takenNames()))
    }
  } catch (error) {
    Modal.set(`Couldn't import ${file.name}: ${(error as Error).message}`)
  }
}

export const importFile = () => {
  if (IS_PLUGIN) return importInPlugin()

  const file = document.createElement('input')
  file.type = 'file'
  file.accept = '.wav, .json'
  file.onchange = e => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    const reader = new FileReader()
    if (!file) return

    // Browsers report WAV files under several MIME types, or none, so the extension decides too.
    const extension = file.name.toLowerCase().split('.').pop()

    if (file.type === 'application/json' || extension === 'json') {
      reader.onload = e => loadJsonImport(e.target?.result as string)
      reader.readAsText(file)
    }

    if (file.type === 'audio/wav' || extension === 'wav') {
      reader.onload = e =>
        loadWav(e.target?.result as ArrayBuffer, uniqueBreakName(file.name, takenNames()))
      reader.readAsArrayBuffer(file)
    }
  }
  file.click()
  file.remove()
}
