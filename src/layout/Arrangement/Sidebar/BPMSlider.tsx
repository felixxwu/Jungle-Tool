import { Slider } from '../../../components/Slider'
import { BPM } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { maxBPM, minBPM } from '../../../lib/consts'
import { useDebouncedLocalState } from '../../../hooks/useDebouncedLocalState'

export const BPMSlider = () => {
  const bpm = BPM.useState()

  const [localBPM, setLocalBPM] = useDebouncedLocalState(bpm, value => {
    BPM.set(value)
  })

  return (
    <>
      <HDivider />
      <Slider
        min={minBPM}
        max={maxBPM}
        value={localBPM}
        onInput={setLocalBPM}
        label={`BPM: ${localBPM}`}
      />
    </>
  )
}
