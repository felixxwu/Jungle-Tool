import styled from 'styled-components'
import { colors } from './lib/colors'
import { library, lineThickness } from './lib/consts'
import { HDivider } from './components/Dividers'
import { TopBar } from './layout/TopBar'
import { Arrangement } from './layout/Arrangement'
import { LoadedFiles, Tab } from './lib/store'
import { Library } from './layout/Library'
import { useEffect } from 'react'
import { fetchFile } from './lib/audio'

export default function App() {
  const tab = Tab.useState()

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
            samples: samples,
          },
        ])
      }
    })()
  }, [])

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
