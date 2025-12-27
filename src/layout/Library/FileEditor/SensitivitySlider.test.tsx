import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { SensitivitySlider } from './SensitivitySlider'
import { AutoSliceSensitivity } from '../../../lib/store'
import { autoSlice } from '../../../actions/autoSlice'

// Mock dependencies
vi.mock('../../../actions/autoSlice', () => ({
  autoSlice: vi.fn(),
}))

vi.mock('../../../lib/debounce', () => ({
  throttleAndDebounce: vi.fn((fn: () => void) => fn), // Return function directly for testing
}))

describe('SensitivitySlider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    AutoSliceSensitivity.set(2000)
  })

  it('renders slider with label', () => {
    render(<SensitivitySlider />)
    expect(screen.getByText('Auto-slice Sensitivity')).toBeInTheDocument()
  })

  it('displays slider with inverted value', () => {
    // AutoSliceSensitivity = 2000, max = 2^15 = 32768
    // Slider value = 32768 - 2000 = 30768
    AutoSliceSensitivity.set(2000)
    render(<SensitivitySlider />)
    const slider = screen.getByLabelText('Auto-slice Sensitivity') as HTMLInputElement
    expect(slider.value).toBe('30768')
  })

  it('updates AutoSliceSensitivity when slider changes', async () => {
    render(<SensitivitySlider />)
    const slider = screen.getByLabelText('Auto-slice Sensitivity') as HTMLInputElement

    await act(async () => {
      const { fireEvent } = await import('../../../test/test-utils')
      // Set value and trigger input event
      slider.value = '10000'
      fireEvent.input(slider, { target: { value: '10000' } })
    })

    // Slider value 10000 -> AutoSliceSensitivity = 32768 - 10000 = 22768
    expect(AutoSliceSensitivity.ref()).toBe(22768)
  })

  it('triggers autoSlice when sensitivity changes', async () => {
    render(<SensitivitySlider />)
    const slider = screen.getByLabelText('Auto-slice Sensitivity') as HTMLInputElement

    await act(async () => {
      const { fireEvent } = await import('../../../test/test-utils')
      slider.value = '15000'
      fireEvent.input(slider, { target: { value: '15000' } })
    })

    // Should trigger autoSlice (mocked to be called directly due to throttleAndDebounce mock)
    expect(autoSlice).toHaveBeenCalled()
  })

  it('handles minimum sensitivity value', async () => {
    AutoSliceSensitivity.set(0)
    render(<SensitivitySlider />)
    const slider = screen.getByLabelText('Auto-slice Sensitivity') as HTMLInputElement
    // Slider value should be max (32768)
    expect(slider.value).toBe('32768')
  })

  it('handles maximum sensitivity value', async () => {
    AutoSliceSensitivity.set(32768)
    render(<SensitivitySlider />)
    const slider = screen.getByLabelText('Auto-slice Sensitivity') as HTMLInputElement
    // Slider value should be 0
    expect(slider.value).toBe('0')
  })
})

