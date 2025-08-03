import styled from 'styled-components'
import { Text } from '../../../../components/Text'
import { Arrangement, NumBars, SelectedBar } from '../../../../lib/store'
import { VDivider } from '../../../../components/Dividers'
import { Fragment } from 'react/jsx-runtime'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'

export const BarSelection = () => {
  const numBars = NumBars.useState()
  const selectedBar = SelectedBar.useState()

  const [localSelectedBar, setLocalSelectedBar] = useDebouncedLocalState(
    selectedBar,
    SelectedBar.set,
    10
  )

  const addBars = () => {
    NumBars.set(numBars + 1)
    setLocalSelectedBar(numBars)
    const firstBar = Arrangement.ref().filter(n => n.startStep < 16)
    const secondBar = Arrangement.ref().filter(n => n.startStep >= 16 && n.startStep < 32)

    if (numBars === 1) {
      Arrangement.set([...firstBar, ...firstBar.map(n => ({ ...n, startStep: n.startStep + 16 }))])
    }
    if (numBars === 2) {
      Arrangement.set([
        ...Arrangement.ref(),
        ...firstBar.map(n => ({ ...n, startStep: n.startStep + 32 })),
      ])
    }
    if (numBars === 3) {
      Arrangement.set([
        ...Arrangement.ref(),
        ...secondBar.map(n => ({ ...n, startStep: n.startStep + 32 })),
      ])
    }
  }

  const removeBars = () => {
    Arrangement.set(Arrangement.ref().slice(0, -16))
    NumBars.set(numBars - 1)
    setLocalSelectedBar(localSelectedBar - 1)
  }

  return (
    <BarSelectionStyle>
      {Array.from({ length: numBars }).map((_, i) => (
        <Fragment key={i}>
          <Text
            key={i}
            big
            selected={localSelectedBar === i}
            onClick={() => setLocalSelectedBar(i)}
          >
            Bar {i + 1}
          </Text>
          <VDivider />
        </Fragment>
      ))}
      {numBars > 1 && (
        <>
          <Text onClick={removeBars} big style={{ textTransform: 'lowercase', paddingTop: '4px' }}>
            x
          </Text>
          <VDivider />
        </>
      )}
      {numBars < 4 && (
        <>
          <Text onClick={addBars} big>
            +
          </Text>
          <VDivider />
        </>
      )}
    </BarSelectionStyle>
  )
}

const BarSelectionStyle = styled('div')`
  display: flex;
`
