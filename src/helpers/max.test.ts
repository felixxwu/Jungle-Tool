import { describe, it, expect } from 'vitest'
import { max, min } from './max'

describe('max', () => {
  it('finds maximum value in array', () => {
    const arr = new Float32Array([1, 5, 3, 9, 2])
    expect(max(arr)).toBe(9)
  })

  it('handles array with negative values', () => {
    const arr = new Float32Array([-5, -1, -10, -3])
    expect(max(arr)).toBe(-1)
  })

  it('handles array with mixed positive and negative values', () => {
    const arr = new Float32Array([-5, 10, -3, 5, -1])
    expect(max(arr)).toBe(10)
  })

  it('handles single element array', () => {
    const arr = new Float32Array([42])
    expect(max(arr)).toBe(42)
  })

  it('handles array with all same values', () => {
    const arr = new Float32Array([5, 5, 5, 5])
    expect(max(arr)).toBe(5)
  })

  it('handles array with zeros', () => {
    const arr = new Float32Array([0, 0, 0, 0])
    expect(max(arr)).toBe(0)
  })

  it('handles large array', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i)
    const arr = new Float32Array(values)
    expect(max(arr)).toBe(999)
  })
})

describe('min', () => {
  it('finds minimum value in array', () => {
    const arr = new Float32Array([1, 5, 3, 9, 2])
    expect(min(arr)).toBe(1)
  })

  it('handles array with negative values', () => {
    const arr = new Float32Array([-5, -1, -10, -3])
    expect(min(arr)).toBe(-10)
  })

  it('handles array with mixed positive and negative values', () => {
    const arr = new Float32Array([-5, 10, -3, 5, -1])
    expect(min(arr)).toBe(-5)
  })

  it('handles single element array', () => {
    const arr = new Float32Array([42])
    expect(min(arr)).toBe(42)
  })

  it('handles array with all same values', () => {
    const arr = new Float32Array([5, 5, 5, 5])
    expect(min(arr)).toBe(5)
  })

  it('handles array with zeros', () => {
    const arr = new Float32Array([0, 0, 0, 0])
    expect(min(arr)).toBe(0)
  })

  it('handles large array', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i)
    const arr = new Float32Array(values)
    expect(min(arr)).toBe(0)
  })
})

