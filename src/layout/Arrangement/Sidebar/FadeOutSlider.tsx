import { Slider } from '../../../components/Slider'
import { NoteFadeOut } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { useDebouncedLocalState } from '../../../hooks/useDebouncedLocalState'
import { maxNoteFadeOut, minNoteFadeOut } from '../../../lib/consts'

export const FadeOutSlider = () => {
  const noteFadeOut = NoteFadeOut.useState()

  const [localNoteFadeOut, setLocalNoteFadeOut] = useDebouncedLocalState(
    noteFadeOut,
    NoteFadeOut.set,
    500
  )

  return (
    <>
      <HDivider />
      <Slider
        min={minNoteFadeOut}
        max={maxNoteFadeOut}
        value={localNoteFadeOut}
        onInput={setLocalNoteFadeOut}
        label={`Fade Out: ${localNoteFadeOut}ms`}
      />
    </>
  )
}
