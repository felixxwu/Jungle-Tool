import styled from 'styled-components'
import { createPlayer } from '../../../lib/audio'
import { LoadedFiles, Player, SelectedFile } from '../../../lib/store'
import { Tone } from '../../../lib/tone'
import type { LoadedFile } from '../../../lib/types'
import { Text } from '../../../components/Text'
import { HDivider } from '../../../components/Dividers'
import { colors } from '../../../lib/colors'

export const FileList = () => {
  const loadedFiles = LoadedFiles.useState()
  const selectedFile = SelectedFile.useState()

  const handlePlay = async (file: LoadedFile) => {
    await Tone.start()
    Player.ref()?.dispose()
    const player = await createPlayer(file.samples)
    Player.set(player)
    player.start()
    SelectedFile.set(file)
  }

  return (
    <FileListStyle>
      {loadedFiles.map(file => (
        <>
          <Text
            key={file.path}
            onClick={() => handlePlay(file)}
            selected={selectedFile?.path === file.path}
          >
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
  width: 250px;
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
