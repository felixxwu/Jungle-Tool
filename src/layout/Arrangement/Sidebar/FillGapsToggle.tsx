import { Toggle } from '../../../components/Toggle'
import { HDivider } from '../../../components/Dividers'
import { FillGaps, ShortenNotes } from '../../../lib/store'

export const FillGapsToggle = () => {
  const fillGaps = FillGaps.useState()

  return (
    <>
      <HDivider />
      <Toggle
        label='Fill Gaps'
        title="Plays each slice and then the same slice reversed, cut off where the break's next slice starts, so no step is left silent."
        checked={fillGaps}
        onClick={() => {
          const newValue = !fillGaps
          FillGaps.set(newValue)
          if (newValue) {
            ShortenNotes.set(false)
          }
        }}
      />
    </>
  )
}
