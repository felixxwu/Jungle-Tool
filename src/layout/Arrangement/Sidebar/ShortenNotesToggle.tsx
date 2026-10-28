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
        title='Fades every note out once it has played for the note length, over the fade-out time.'
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
