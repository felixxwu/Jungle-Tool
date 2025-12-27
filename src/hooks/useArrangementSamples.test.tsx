import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '../test/test-utils'
import { useArrangementSamples } from './useArrangementSamples'
import {
  Arrangement,
  BPM,
  Layers,
  LoadedFiles,
  NumBars,
  Swing,
} from '../lib/store'
import { getArrangementSamples } from '../helpers/getArrangementSamples'

// Mock getArrangementSamples
vi.mock('../helpers/getArrangementSamples', () => ({
  getArrangementSamples: vi.fn(() => [
    new Float32Array(1000),
    new Float32Array(1000),
  ]),
}))

describe('useArrangementSamples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Arrangement.set([])
    BPM.set(120)
    Layers.set([])
    LoadedFiles.set([])
    NumBars.set(1)
    Swing.set(17)
  })

  it('returns arrangement samples', () => {
    const TestComponent = () => {
      const samples = useArrangementSamples({})
      expect(samples).not.toBeNull()
      expect(getArrangementSamples).toHaveBeenCalledWith({})
      return null
    }
    render(<TestComponent />)
  })

  it('passes bar parameter to getArrangementSamples', () => {
    const TestComponent = () => {
      const samples = useArrangementSamples({ bar: 1 })
      expect(samples).not.toBeNull()
      expect(getArrangementSamples).toHaveBeenCalledWith({ bar: 1 })
      return null
    }
    render(<TestComponent />)
  })

  it('re-renders when Arrangement changes', () => {
    const TestComponent = () => {
      useArrangementSamples({})
      return null
    }
    const { rerender } = render(<TestComponent />)

    Arrangement.set([{ startStep: 0, stepNumToPlay: 0 }])
    rerender(<TestComponent />)

    expect(getArrangementSamples).toHaveBeenCalledTimes(2)
  })

  it('re-renders when BPM changes', () => {
    const TestComponent = () => {
      useArrangementSamples({})
      return null
    }
    const { rerender } = render(<TestComponent />)

    BPM.set(160)
    rerender(<TestComponent />)

    expect(getArrangementSamples).toHaveBeenCalledTimes(2)
  })

  it('re-renders when Layers change', () => {
    const TestComponent = () => {
      useArrangementSamples({})
      return null
    }
    const { rerender } = render(<TestComponent />)

    Layers.set([{ filename: 'test', volume: 50, pitch: 0 }])
    rerender(<TestComponent />)

    expect(getArrangementSamples).toHaveBeenCalledTimes(2)
  })

  it('re-renders when LoadedFiles change', () => {
    const TestComponent = () => {
      useArrangementSamples({})
      return null
    }
    const { rerender } = render(<TestComponent />)

    LoadedFiles.set([
      {
        name: 'test',
        samples: [new Float32Array(100), new Float32Array(100)],
        slices: [],
        artist: '',
        year: 0,
        whosampledLink: '',
        whosampledCount: 0,
      },
    ])
    rerender(<TestComponent />)

    expect(getArrangementSamples).toHaveBeenCalledTimes(2)
  })

  it('re-renders when NumBars changes', () => {
    const TestComponent = () => {
      useArrangementSamples({})
      return null
    }
    const { rerender } = render(<TestComponent />)

    NumBars.set(2)
    rerender(<TestComponent />)

    expect(getArrangementSamples).toHaveBeenCalledTimes(2)
  })

  it('re-renders when Swing changes', () => {
    const TestComponent = () => {
      useArrangementSamples({})
      return null
    }
    const { rerender } = render(<TestComponent />)

    Swing.set(25)
    rerender(<TestComponent />)

    expect(getArrangementSamples).toHaveBeenCalledTimes(2)
  })
})

