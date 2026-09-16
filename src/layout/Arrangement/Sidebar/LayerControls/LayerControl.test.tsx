import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '../../../../test/test-utils'
import { LayerControl } from './LayerControl'
import { Layers } from '../../../../lib/store'
import type { Layer } from '../../../../lib/types'

describe('LayerControl', () => {
  const mockLayer: Layer = {
    filename: 'Test Break',
    volume: 50,
    pitch: 0,
  }

  beforeEach(() => {
    Layers.set([mockLayer])
  })

  it('renders layer filename', () => {
    render(<LayerControl layer={mockLayer} />)
    expect(screen.getByText('Test Break')).toBeInTheDocument()
  })

  it('always shows volume and pitch sliders', () => {
    render(<LayerControl layer={mockLayer} />)
    expect(screen.getByLabelText(/Vol:/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Pitch:/)).toBeInTheDocument()
  })

  it('always shows the delete button', () => {
    render(<LayerControl layer={mockLayer} />)
    expect(screen.getByText('x')).toBeInTheDocument()
  })

  it('removes layer when delete button is clicked', async () => {
    Layers.set([mockLayer, { filename: 'Other Break', volume: 50, pitch: 0 }])
    render(<LayerControl layer={mockLayer} />)

    const deleteButton = screen.getByText('x')
    await act(async () => {
      deleteButton.click()
    })

    // Wait for state update
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    const layers = Layers.ref()
    expect(layers.length).toBe(1)
    expect(layers[0].filename).toBe('Other Break')
  })

  it('displays positive pitch with + prefix', () => {
    const layerWithPositivePitch: Layer = { ...mockLayer, pitch: 5 }
    Layers.set([layerWithPositivePitch])
    render(<LayerControl layer={layerWithPositivePitch} />)
    expect(screen.getByLabelText('Pitch: +5')).toBeInTheDocument()
  })

  it('displays negative pitch without prefix', () => {
    const layerWithNegativePitch: Layer = { ...mockLayer, pitch: -3 }
    Layers.set([layerWithNegativePitch])
    render(<LayerControl layer={layerWithNegativePitch} />)
    expect(screen.getByLabelText('Pitch: -3')).toBeInTheDocument()
  })

  it('updates volume when volume slider is changed', async () => {
    render(<LayerControl layer={mockLayer} />)

    const volumeSlider = screen.getByLabelText(/Vol:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(volumeSlider, 'value', {
        writable: true,
        value: '75',
      })
      volumeSlider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    const layers = Layers.ref()
    expect(layers[0].volume).toBe(75)
  })

  it('updates pitch when pitch slider is changed', async () => {
    render(<LayerControl layer={mockLayer} />)

    const pitchSlider = screen.getByLabelText(/Pitch:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(pitchSlider, 'value', {
        writable: true,
        value: '7',
      })
      pitchSlider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce (500ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    const layers = Layers.ref()
    expect(layers[0].pitch).toBe(7)
  })

  it('updates only the selected layer when multiple layers exist', async () => {
    const layer1: Layer = { filename: 'Break 1', volume: 50, pitch: 0 }
    const layer2: Layer = { filename: 'Break 2', volume: 60, pitch: 2 }
    Layers.set([layer1, layer2])

    render(<LayerControl layer={layer1} />)

    const volumeSlider = screen.getByLabelText(/Vol:/) as HTMLInputElement

    await act(async () => {
      Object.defineProperty(volumeSlider, 'value', {
        writable: true,
        value: '80',
      })
      volumeSlider.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 520))
    })

    const layers = Layers.ref()
    expect(layers[0].volume).toBe(80) // layer1 updated
    expect(layers[1].volume).toBe(60) // layer2 unchanged
  })
})
