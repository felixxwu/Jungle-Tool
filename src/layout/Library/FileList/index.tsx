import styled from 'styled-components'
import { createPlayer } from '../../../lib/audio'
import { LoadedFiles, Player, SelectedFileIndex } from '../../../lib/store'
import { Tone } from '../../../lib/tone'
import { Text } from '../../../components/Text'
import { HDivider } from '../../../components/Dividers'
import { colors } from '../../../lib/colors'
import { librarySidebarWidth } from '../../../lib/consts'

export const FileList = () => {
  const loadedFiles = LoadedFiles.useState()
  const selectedFile = SelectedFileIndex.useState()

  const handlePlay = async (index: number) => {
    await Tone.start()
    Player.ref()?.dispose()
    const player = await createPlayer(loadedFiles[index].samples)
    Player.set(player)
    player.start()
    SelectedFileIndex.set(index)
  }

  return (
    <FileListStyle>
      {loadedFiles.map((file, index) => (
        <>
          <Text key={file.path} onClick={() => handlePlay(index)} selected={selectedFile === index}>
            <FileListItemStyle>
              <div>{file.name}</div>
              <ArtistAndYear>
                <div>{file.artist}</div>
                <div>{file.year}</div>
              </ArtistAndYear>
            </FileListItemStyle>
          </Text>
          <HDivider />
        </>
      ))}
    </FileListStyle>
  )
}

const FileListStyle = styled('div')`
  display: flex;
  flex-direction: column;
  min-width: ${librarySidebarWidth}px;
`

const FileListItemStyle = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const ArtistAndYear = styled('div')`
  width: 100%;
  color: ${colors.darkGrey};
  display: flex;
  justify-content: space-between;
`
