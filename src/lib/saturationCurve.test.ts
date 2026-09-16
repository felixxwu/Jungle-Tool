import { describe, it, expect } from 'vitest'
import { getSaturationCurve } from './saturationCurve'

const sampleCurve = (curve: Float32Array, x: number) => {
  const index = Math.round(((x + 1) / 2) * (curve.length - 1))
  return curve[index]
}

describe('getSaturationCurve', () => {
  it('is identity at saturation 0', () => {
    const curve = getSaturationCurve(0)
    expect(sampleCurve(curve, 0)).toBeCloseTo(0, 3)
    expect(sampleCurve(curve, 0.5)).toBeCloseTo(0.5, 3)
    expect(sampleCurve(curve, -1)).toBeCloseTo(-1, 3)
  })

  it('applies pure sine shaping at saturation 50', () => {
    const curve = getSaturationCurve(50)
    expect(sampleCurve(curve, 0.5)).toBeCloseTo(Math.sin(0.5 * (Math.PI / 2)), 3)
  })

  it('leaves the endpoints at full scale', () => {
    const curve = getSaturationCurve(50)
    expect(curve[0]).toBeCloseTo(-1, 3)
    expect(curve[curve.length - 1]).toBeCloseTo(1, 3)
  })

  it('is monotonically non-decreasing at every saturation setting', () => {
    for (const saturation of [0, 25, 50, 75, 100]) {
      const curve = getSaturationCurve(saturation)
      for (let i = 1; i < curve.length; i++) {
        expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1] - 1e-6)
      }
    }
  })

  it('returns a 4096 point curve', () => {
    expect(getSaturationCurve(50).length).toBe(4096)
  })
})
