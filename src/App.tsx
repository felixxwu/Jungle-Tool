import styled from 'styled-components'
import { colors } from './lib/colors'
import { appHeight, appWidth, library, lineThickness } from './lib/consts'
import { HDivider } from './components/Dividers'
import { TopBar } from './layout/TopBar'
import { Arrangement } from './layout/Arrangement'
import { LoadedFiles, Modal, Tab, WindowSize } from './lib/store'
import { Library } from './layout/Library'
import { useEffect } from 'react'
import { fetchFile, normalize } from './lib/audio'

export default function App() {
  const tab = Tab.useState()
  const modal = Modal.useState()

  useEffect(() => {
    ;(async () => {
      LoadedFiles.set([])
      for (const file of library) {
        const samples = await fetchFile(`${file.path}.wav`)
        LoadedFiles.set([
          ...LoadedFiles.ref(),
          {
            path: file.path,
            name: file.name,
            artist: file.artist,
            year: file.year,
            samples: normalize(samples),
            slices: [],
          },
        ])
      }
    })()

    window.addEventListener('resize', () => {
      WindowSize.set({ width: window.innerWidth, height: window.innerHeight })
    })
  }, [])

  return (
    <>
      {modal && <ModalStyle>{modal}</ModalStyle>}
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
  position: absolute;
  border: ${lineThickness}px solid ${colors.black};
  box-shadow: 10px 10px 0 0 ${colors.black};
  background-color: ${colors.white};
`
