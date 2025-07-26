import styled from 'styled-components'
import { Slider } from '../../../components/Slider'
import { BPM } from '../../../lib/store'
import { HDivider } from '../../../components/Dividers'
import { Text } from '../../../components/Text'
import { maxBPM, minBPM } from '../../../lib/consts'

export const BPMSlider = () => {
  const bpm = BPM.useState()

  return (
    <>
      <Row>
        <Text $fullWidth={true}>BPM</Text>
        <Text>{bpm}</Text>
      </Row>
      <HDivider />
      <Slider min={minBPM} max={maxBPM} value={bpm} onInput={BPM.set} />
      <HDivider />
    </>
  )
}

const Row = styled('div')`
  display: flex;
  justify-content: space-between;
`
