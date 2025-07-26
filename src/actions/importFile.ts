import { loadJson } from './loadJson'
import { loadWav } from './loadWav'

export const importFile = () => {
  const file = document.createElement('input')
  file.type = 'file'
  file.accept = '.wav, .json'
  file.onchange = e => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    const reader = new FileReader()
    if (!file) return

    if (file.type === 'application/json') {
      reader.onload = e => loadJson(e.target?.result as string)
      reader.readAsText(file)
    }

    if (file.type === 'audio/wav') {
      reader.onload = e => loadWav(e.target?.result as ArrayBuffer, file.name)
      reader.readAsArrayBuffer(file)
    }
  }
  file.click()
  file.remove()
}
