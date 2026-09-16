import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '../test/test-utils'
import { useCleanupTempLayer } from './useCleanupTempLayer'
import { Layers, Tab } from '../lib/store'

const TestComponent = () => {
  useCleanupTempLayer()
  return null
}

describe('useCleanupTempLayer', () => {
  beforeEach(() => {
    Layers.set([])
    Tab.set('library')
  })

  it('keeps a temp layer while on the library tab', () => {
    Layers.set([{ filename: 'preview', volume: 50, pitch: 0, temp: true }])
    render(<TestComponent />)

    expect(Layers.ref().length).toBe(1)
  })

  it('removes the temp layer when leaving the library tab without confirming', async () => {
    Layers.set([
      { filename: 'permanent', volume: 50, pitch: 0 },
      { filename: 'preview', volume: 50, pitch: 0, temp: true },
    ])
    const { rerender } = render(<TestComponent />)

    await act(async () => {
      Tab.set('arrangement')
    })
    rerender(<TestComponent />)

    const layers = Layers.ref()
    expect(layers.length).toBe(1)
    expect(layers[0].filename).toBe('permanent')
  })

  it('does not touch layers once confirmed (temp already cleared)', async () => {
    Layers.set([{ filename: 'confirmed', volume: 50, pitch: 0, temp: false }])
    const { rerender } = render(<TestComponent />)

    await act(async () => {
      Tab.set('arrangement')
    })
    rerender(<TestComponent />)

    expect(Layers.ref().length).toBe(1)
    expect(Layers.ref()[0].filename).toBe('confirmed')
  })
})
