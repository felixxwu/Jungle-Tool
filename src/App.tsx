import styled from 'styled-components'
import { colors } from './lib/colors'
import { lineThickness } from './lib/consts'
import { HDivider } from './components/Dividers'
import { TopBar } from './layout/TopBar'
import { Arrangement } from './layout/Arrangement'
import { Tab } from './lib/store'
import { Library } from './layout/Library'

export default function App() {
  const tab = Tab.useState()

  return (
    <>
      <AppStyle>
        <TopBar />
        <HDivider />
        {tab === 'arrangement' && <Arrangement />}
        {tab === 'library' && <Library />}
      </AppStyle>
    </>
  )
}

const AppStyle = styled('div')`
  width: 800px;
  max-width: 100vw;
  border: ${lineThickness}px solid ${colors.black};
  box-shadow: 10px 10px 0 0 ${colors.black};
  background-color: ${colors.grey};
  display: flex;
  flex-direction: column;
`
