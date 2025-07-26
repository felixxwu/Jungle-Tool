import { useRef } from 'react'
import { Slider } from '../../../components/Slider'
import { AutoSliceSensitivity } from '../../../lib/store'
import { throttleAndDebounce } from '../../../lib/debounce'
import { autoSlice } from '../../../actions/autoSlice'

export const SensitivitySlider = () => {
  const autoSliceSensitivity = AutoSliceSensitivity.useState()
  const handleAutoSlice = useRef(throttleAndDebounce(autoSlice, 100))

  return (
    <Slider
      min={0}
      max={Math.pow(2, 15)}
      value={Math.pow(2, 15) - autoSliceSensitivity}
      onInput={value => {
        AutoSliceSensitivity.set(Math.pow(2, 15) - value)
        handleAutoSlice.current()
      }}
    />
  )
}
