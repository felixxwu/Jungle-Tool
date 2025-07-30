import styled from 'styled-components'
import { Text } from '../../../../components/Text'
import { Arrangement, NumBars, SelectedBar } from '../../../../lib/store'
import { VDivider } from '../../../../components/Dividers'
import { largeTextHeight } from '../../../../lib/consts'
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
    if (numBars === 1) {
      NumBars.set(2)
      setLocalSelectedBar(1)
      const firstBar = [...Arrangement.ref()].filter(n => n.startStep < 16)
      Arrangement.set([...firstBar, ...firstBar.map(n => ({ ...n, startStep: n.startStep + 16 }))])
    }
    if (numBars === 2) {
      NumBars.set(4)
      setLocalSelectedBar(2)
      const firstBar = [...Arrangement.ref()].filter(n => n.startStep < 16)
      const secondBar = [...Arrangement.ref()].filter(n => n.startStep >= 16)
      Arrangement.set([
        ...firstBar,
        ...secondBar,
        ...firstBar.map(n => ({ ...n, startStep: n.startStep + 32 })),
        ...secondBar.map(n => ({ ...n, startStep: n.startStep + 32 })),
      ])
    }
  }

  const removeBars = () => {
    if (numBars === 2) {
      NumBars.set(1)
      setLocalSelectedBar(0)
      Arrangement.set([...Arrangement.ref()].filter(n => n.startStep < 16))
    }
    if (numBars === 4) {
      NumBars.set(2)
      setLocalSelectedBar(0)
      const firstBar = [...Arrangement.ref()].filter(n => n.startStep < 16)
      const secondBar = [...Arrangement.ref()].filter(n => n.startStep >= 16)
      Arrangement.set([...firstBar, ...secondBar])
    }
  }

  return (
    <BarSelectionStyle>
      {Array.from({ length: numBars }).map((_, i) => (
        <Fragment key={i}>
          <Text
            key={i}
            style={{ height: largeTextHeight }}
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
          <Text onClick={removeBars} style={{ height: largeTextHeight }}>
            x
          </Text>
          <VDivider />
        </>
      )}
      {numBars < 4 && (
        <>
          <Text onClick={addBars} style={{ height: largeTextHeight }}>
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
