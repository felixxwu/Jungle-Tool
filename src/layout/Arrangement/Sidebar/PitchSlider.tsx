import styled from 'styled-components'
import { Slider } from '../../../components/Slider'
import { Pitch } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { maxPitch, minPitch } from '../../../lib/consts'

export const PitchSlider = () => {
  const pitch = Pitch.useState()

  return (
    <>
      <Row>
        <Text $fullWidth={true}>Pitch</Text>
        <Text>{pitch > 0 ? `+${pitch}` : pitch}</Text>
      </Row>
      <HDivider />
      <Slider min={minPitch} max={maxPitch} value={pitch} onInput={Pitch.set} />
      <HDivider />
    </>
  )
}

const Row = styled('div')`
  display: flex;
  justify-content: space-between;
`
