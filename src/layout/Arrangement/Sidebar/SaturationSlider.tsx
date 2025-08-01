import { Slider } from '../../../components/Slider'
import { Saturation } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { useDebouncedLocalState } from '../../../hooks/useDebouncedLocalState'

export const SaturationSlider = () => {
  const saturation = Saturation.useState()

  const [localSaturation, setLocalSaturation] = useDebouncedLocalState(saturation, Saturation.set)

  const label = (() => {
    if (localSaturation <= 50) {
      return `Sat: ${localSaturation * 2}%`
    }

    return `Sat: +${Math.round(((localSaturation - 50) / 50) * 12)}db`
  })()

  return (
    <>
      <HDivider />
      <Slider
        min={0}
        max={100}
        value={localSaturation}
        onInput={setLocalSaturation}
        label={label}
      />
    </>
  )
}
