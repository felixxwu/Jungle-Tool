import { Toggle } from '../../../components/Toggle'
import { HDivider } from '../../../components/Dividers'
import { ShortenNotes, FillGaps } from '../../../lib/store'

export const ShortenNotesToggle = () => {
  const shortenNotes = ShortenNotes.useState()

  return (
    <>
      <HDivider />
      <Toggle
        label='Shorten Notes'
        checked={shortenNotes}
        onClick={() => {
          const newValue = !shortenNotes
          ShortenNotes.set(newValue)
          if (newValue) {
            FillGaps.set(false)
          }
        }}
      />
    </>
  )
}
