import type { Layer } from '../lib/types'

const numSlots = 8

type Globals = { saturation: number; swing: number; noteLength: number; noteFadeOut: number }

// The plugin's DAW parameter values implied by the UI's state. Preview layers have no slot, and a
// layer being replaced keeps its original's values until the replacement is kept.
export const parametersFromState = (
  layers: Layer[],
  replacing: { index: number; original: Layer } | null,
  globals: Globals
) => {
  const values: Record<string, number> = { ...globals }
  let slot = 0
  layers.forEach((layer, index) => {
    if (layer.temp || slot >= numSlots) return
    const source = replacing?.index === index ? replacing.original : layer
    slot++
    values[`volume${slot}`] = Math.min(100, source.volume)
    values[`pitch${slot}`] = source.pitch
  })
  return values
}

// Writes parameter values from the DAW (automation, undo) back into the layers that own each slot.
export const layersWithParameters = (
  layers: Layer[],
  values: Record<string, number>,
  replacingIndex: number | null
) => {
  let slot = 0
  return layers.map((layer, index) => {
    if (layer.temp || slot >= numSlots) return layer
    slot++
    if (index === replacingIndex) return layer
    const volume = values[`volume${slot}`]
    const pitch = values[`pitch${slot}`]
    return volume === layer.volume && pitch === layer.pitch ? layer : { ...layer, volume, pitch }
  })
}
