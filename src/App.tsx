import styled from 'styled-components'
import { colors } from './lib/colors'
import { appHeight, appWidth, library, lineThickness } from './lib/consts'
import { HDivider } from './components/Dividers'
import { TopBar } from './layout/TopBar'
import { Arrangement } from './layout/Arrangement'
import { LoadedFiles, Modal, Tab, WindowSize } from './lib/store'
import { Library } from './layout/Library'
import { useEffect } from 'react'
import { loadJson } from './actions/loadJson'

export default function App() {
  const tab = Tab.useState()
  const modal = Modal.useState()

  useEffect(() => {
    ;(async () => {
      LoadedFiles.set([])
      for (const path of library) {
        const response = await fetch(path)
        const json = await response.text()
        loadJson(json)
      }
    })()

    window.addEventListener('resize', () => {
      WindowSize.set({ width: window.innerWidth, height: window.innerHeight })
    })
  }, [])

  return (
    <>
      {modal && (
        <>
          <ModalBackground />
          <ModalStyle>{modal}</ModalStyle>
        </>
      )}
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
  width: ${appWidth}px;
  height: ${appHeight}px;
  max-width: 100vw;
  border: ${lineThickness}px solid ${colors.black};
  box-shadow: 10px 10px 0 0 ${colors.black};
  background-color: ${colors.grey};
  display: flex;
  flex-flow: column;
`

const ModalStyle = styled('div')`
  border: ${lineThickness}px solid ${colors.black};
  box-shadow: 10px 10px 0 0 ${colors.black};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  z-index: 1000;
  background-color: ${colors.white};
  border: 1px solid ${colors.black};
  box-shadow: 10px 10px 0 0 ${colors.black};
  line-height: 1.2;
`

const ModalBackground = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100svh;
  background-color: ${colors.black};
  opacity: 0.5;
  z-index: 999;
`
