import { describe, expect, it } from 'vitest'
import { layersWithParameters, parametersFromState } from './pluginParameters'

const globals = { saturation: 50, swing: 17, noteLength: 200, noteFadeOut: 10 }
const layer = (filename: string, volume: number, pitch: number, temp?: boolean) => ({
  filename,
  volume,
  pitch,
  ...(temp ? { temp } : {}),
})

describe('parametersFromState', () => {
  it('gives each non-preview layer the next slot', () => {
    const values = parametersFromState(
      [layer('a', 10, 1), layer('preview', 20, 2, true), layer('b', 30, 3)],
      null,
      globals
    )
    expect(values).toEqual({ ...globals, volume1: 10, pitch1: 1, volume2: 30, pitch2: 3 })
  })

  it('keeps the original values in a slot whose layer is being replaced', () => {
    const values = parametersFromState(
      [layer('candidate', 80, 5)],
      { index: 0, original: layer('original', 40, -2) },
      globals
    )
    expect(values).toMatchObject({ volume1: 40, pitch1: -2 })
  })

  it('clamps a suggested volume above 100', () => {
    expect(parametersFromState([layer('quiet', 140, 0)], null, globals).volume1).toBe(100)
  })

  it('shifts later layers down a slot when one is removed', () => {
    const before = parametersFromState([layer('a', 10, 1), layer('b', 30, 3)], null, globals)
    const after = parametersFromState([layer('b', 30, 3)], null, globals)
    expect(before.volume2).toBe(30)
    expect(after.volume1).toBe(30)
  })
})

describe('layersWithParameters', () => {
  it('applies slot values to their layers and skips previews and the layer being replaced', () => {
    const layers = [
      layer('a', 10, 1),
      layer('preview', 20, 2, true),
      layer('b', 30, 3),
      layer('c', 5, 0),
    ]
    const values = { volume1: 11, pitch1: 2, volume2: 33, pitch2: 4, volume3: 66, pitch3: 6 }
    expect(layersWithParameters(layers, values, 3)).toEqual([
      layer('a', 11, 2),
      layer('preview', 20, 2, true),
      layer('b', 33, 4),
      layer('c', 5, 0),
    ])
  })

  it('returns unchanged layers as the same objects', () => {
    const layers = [layer('a', 10, 1)]
    expect(layersWithParameters(layers, { volume1: 10, pitch1: 1 }, null)[0]).toBe(layers[0])
  })
})
