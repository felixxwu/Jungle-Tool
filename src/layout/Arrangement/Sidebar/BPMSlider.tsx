import styled from 'styled-components'
import { Slider } from '../../../components/Slider'
import { BPM, Player } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { maxBPM, minBPM } from '../../../lib/consts'
import { playArrangement } from '../../../actions/playArrangement'

export const BPMSlider = () => {
  const bpm = BPM.useState()

  const handleBPMChange = (value: number) => {
    BPM.set(value)
    if (Player.ref()?.state === 'started') {
      playArrangement()
    }
  }

  return (
    <>
      <Row>
        <Text $fullWidth={true}>BPM</Text>
        <Text>{bpm}</Text>
      </Row>
      <HDivider />
      <Slider min={minBPM} max={maxBPM} value={bpm} onInput={handleBPMChange} />
      <HDivider />
    </>
  )
}

const Row = styled('div')`
  display: flex;
  justify-content: space-between;
`
