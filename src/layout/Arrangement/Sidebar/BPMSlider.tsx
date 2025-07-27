import styled from 'styled-components'
import { Slider } from '../../../components/Slider'
import { BPM } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { maxBPM, minBPM } from '../../../lib/consts'
import { restartPlayback } from '../../../actions/restartPlayback'

export const BPMSlider = () => {
  const bpm = BPM.useState()

  const handleBPMChange = (value: number) => {
    BPM.set(value)
    restartPlayback()
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
