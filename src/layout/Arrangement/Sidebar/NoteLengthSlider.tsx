import { Slider } from '../../../components/Slider'
import { NoteLength } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { useDebouncedLocalState } from '../../../hooks/useDebouncedLocalState'
import { maxNoteLength, minNoteLength } from '../../../lib/consts'

export const NoteLengthSlider = () => {
  const noteLength = NoteLength.useState()

  const [localNoteLength, setLocalNoteLength] = useDebouncedLocalState(
    noteLength,
    NoteLength.set,
    500
  )

  return (
    <>
      <HDivider />
      <Slider
        min={minNoteLength}
        max={maxNoteLength}
        value={localNoteLength}
        onInput={setLocalNoteLength}
        label={`Slice Len: ${localNoteLength}ms`}
      />
    </>
  )
}
