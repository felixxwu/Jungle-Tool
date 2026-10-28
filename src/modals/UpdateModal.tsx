import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { Text } from '../components/Text'
import { Modal } from '../lib/store'
import { callNative, onPluginEvent } from '../lib/plugin'

const isWindows = navigator.userAgent.includes('Windows')

// Offers a newer plugin release; the plugin downloads its installer and opens it.
export const UpdateModal = (p: { version: string }) => {
  const [stage, setStage] = useState<'ask' | 'downloading' | 'opened' | 'failed'>('ask')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    onPluginEvent<number>('updateProgress', setProgress)
  }, [])

  const update = async () => {
    setStage('downloading')
    const result = await callNative<string>('startUpdate')
    setStage(result === 'opened' ? 'opened' : 'failed')
  }

  const later = () => {
    callNative('dismissUpdate')
    Modal.set(null)
  }

  return (
    <ModalContent>
      {stage === 'ask' && (
        <>
          <div>Jungle Tool {p.version} is available. Please update.</div>
          <Row>
            <Text onClick={update}>Update</Text>
            <Text onClick={later}>Later</Text>
          </Row>
        </>
      )}
      {stage === 'downloading' && <div>Downloading... {Math.round(progress * 100)}%</div>}
      {stage === 'opened' && (
        <>
          <div>
            The installer is open.{' '}
            {isWindows
              ? 'Close your DAW when it asks, then reopen it.'
              : 'Restart your DAW once it has finished.'}
          </div>
          <Row>
            <Text onClick={() => Modal.set(null)}>Ok</Text>
          </Row>
        </>
      )}
      {stage === 'failed' && (
        <>
          <div>Couldn't download the update. Please try again later.</div>
          <Row>
            <Text onClick={() => Modal.set(null)}>Ok</Text>
          </Row>
        </>
      )}
    </ModalContent>
  )
}

const ModalContent = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`

const Row = styled('div')`
  display: flex;
  gap: 20px;
`
