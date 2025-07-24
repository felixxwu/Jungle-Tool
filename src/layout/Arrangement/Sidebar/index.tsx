import styled from 'styled-components'
import { Text } from '../../../components/Text'
import { HDivider } from '../../../components/Dividers'
import { Slider } from '../../../components/Slider'
import { BPM, Pitch } from '../../../lib/store'
import { maxBPM, maxPitch, minBPM, minPitch } from '../../../lib/consts'

export const Sidebar = () => {
  const bpm = BPM.useState()
  const pitch = Pitch.useState()

  return (
    <SidebarStyle>
      <Row>
        <Text fullWidth>BPM</Text>
        <Text>{bpm}</Text>
      </Row>
      <HDivider />
      <Slider min={minBPM} max={maxBPM} value={bpm} onInput={BPM.set} />
      <HDivider />
      <Row>
        <Text fullWidth>Pitch</Text>
        <Text>{pitch > 0 ? `+${pitch}` : pitch}</Text>
      </Row>
      <HDivider />
      <Slider min={minPitch} max={maxPitch} value={pitch} onInput={Pitch.set} />
    </SidebarStyle>
  )
}

const SidebarStyle = styled('div')`
  display: flex;
  flex-direction: column;
  width: 200px;
`

const Row = styled('div')`
  display: flex;
  justify-content: space-between;
`
