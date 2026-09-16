const CURVE_POINTS = 4096

/**
 * WaveShaperNode curve for the master saturation stage.
 *
 * Ported from sineSaturation() in ./audio.ts, which works in +/-2^15 sample
 * space. Rescaled to Web Audio's +/-1 domain the maxValue factor cancels and
 * the wet term reduces to sin(x * PI / 2). The mix and preGain mapping is the
 * same one getArrangementSamples used.
 */
export const getSaturationCurve = (saturation: number) => {
  const mix = Math.min(saturation * 2, 100) / 100
  const preGainDb = saturation < 50 ? 0 : ((saturation - 50) / 50) * 12
  const linearGain = Math.pow(10, preGainDb / 20)

  const curve = new Float32Array(CURVE_POINTS)
  for (let i = 0; i < CURVE_POINTS; i++) {
    const x = (i / (CURVE_POINTS - 1)) * 2 - 1
    const driven = Math.max(-1, Math.min(1, x * linearGain))
    const wet = Math.sin(driven * (Math.PI / 2))
    curve[i] = wet * mix + x * (1 - mix)
  }
  return curve
}
