import { masterTrim } from './consts'
import { getSaturationCurve } from './saturationCurve'

const RAMP_TIME_CONSTANT = 0.015

export type Graph = {
  layerGain: (layerKey: string) => GainNode
  setLayerVolume: (layerKey: string, volume: number) => void
  pruneLayers: (layerKeys: string[]) => void
  setSaturation: (saturation: number) => void
  rampTrimTo: (value: number, seconds: number) => void
  disconnect: () => void
}

/**
 * layer gains -> saturation shaper -> trim -> destination
 *
 * Built against any BaseAudioContext so the live and offline paths share it,
 * which is what keeps playback and export in agreement.
 */
export const buildGraph = (ctx: BaseAudioContext): Graph => {
  const trim = ctx.createGain()
  trim.gain.value = masterTrim
  trim.connect(ctx.destination)

  const shaper = ctx.createWaveShaper()
  shaper.oversample = '4x'
  shaper.connect(trim)

  const gains: { [layerKey: string]: GainNode } = {}
  let saturation: number | null = null

  const layerGain = (layerKey: string) => {
    if (!gains[layerKey]) {
      const gain = ctx.createGain()
      gain.connect(shaper)
      gains[layerKey] = gain
    }
    return gains[layerKey]
  }

  return {
    layerGain,
    setLayerVolume: (layerKey, volume) => {
      // setTargetAtTime rather than a direct assignment: a slider drag would
      // otherwise step the gain and produce zipper noise.
      layerGain(layerKey).gain.setTargetAtTime(
        volume / 100,
        ctx.currentTime,
        RAMP_TIME_CONSTANT
      )
    },
    pruneLayers: layerKeys => {
      for (const layerKey of Object.keys(gains)) {
        if (layerKeys.includes(layerKey)) continue
        gains[layerKey].disconnect()
        delete gains[layerKey]
      }
    },
    setSaturation: value => {
      // Only rebuild on a real change: swapping a curve can click, and doing
      // it on every tick would click constantly.
      if (value === saturation) return
      saturation = value
      shaper.curve = getSaturationCurve(value)
    },
    rampTrimTo: (value, seconds) => {
      trim.gain.cancelScheduledValues(ctx.currentTime)
      trim.gain.setValueAtTime(trim.gain.value, ctx.currentTime)
      trim.gain.linearRampToValueAtTime(value, ctx.currentTime + seconds)
    },
    disconnect: () => {
      for (const layerKey of Object.keys(gains)) {
        gains[layerKey].disconnect()
        delete gains[layerKey]
      }
      shaper.disconnect()
      trim.disconnect()
    },
  }
}
