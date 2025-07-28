import { Slider } from '../../../components/Slider'
import { Swing } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { useDebouncedLocalState } from '../../../hooks/useDebouncedLocalState'

export const SwingSlider = () => {
  const swing = Swing.useState()

  const [localSwing, setLocalSwing] = useDebouncedLocalState(swing, value => {
    Swing.set(value)
  })

  return (
    <>
      <HDivider />
      <Slider
        min={0}
        max={50}
        value={localSwing}
        onInput={setLocalSwing}
        label={`Swing: ${localSwing}%`}
      />
    </>
  )
}
