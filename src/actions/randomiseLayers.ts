import { BPM, Layers, LoadedFiles, Swing } from '../lib/store'

export const randomiseLayers = async () => {
  const swing = Swing.ref()
  const savedLayers = [...Layers.ref()]
  Layers.set([])
  await new Promise(r => setTimeout(r, 200))

  const loadedFiles = LoadedFiles.ref()
  for (let i = 0; i < savedLayers.length; i++) {
    const takenLayers = savedLayers.slice(0, i).map(l => l.filename.split('(')[0])
    const remainingFiles = loadedFiles.filter(
      f => !takenLayers.includes(f.name.split('(')[0]) && f.name !== 'PH Break'
    )
    const randomFile = remainingFiles[Math.floor(Math.random() * remainingFiles.length)]
    savedLayers[i].filename = randomFile.name
  }

  const bpm = BPM.ref()
  const stepSizeInSamples = ((60 / bpm) * 44100) / 4
  const getSwingOffset = (index: number) => {
    if (index % 2 === 1) return 0
    return (swing / 100) * stepSizeInSamples
  }

  for (const layer of savedLayers) {
    const file = loadedFiles.find(f => f.name === layer.filename)
    if (!file) continue

    const pitchMults = file.slices.map((s, i) => {
      const nextSliceStart = file.slices[i + 1]?.start || file.samples[0].length
      const sliceLength = nextSliceStart - s.start
      const swungStepSize =
        stepSizeInSamples + getSwingOffset(s.stepNum) - getSwingOffset(s.stepNum + 1)

      return swungStepSize / sliceLength
    })
    const pitchMult = Math.max(...pitchMults)
    const pitchShift = 12 * Math.log2(1 / pitchMult)

    layer.pitch = Math.ceil(pitchShift)
    layer.volume = 100
  }

  Layers.set([...savedLayers])
}
