import styled from 'styled-components'
import { HDivider, VDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers } from '../../../../lib/store'
import { Slider } from '../../../../components/Slider'
import type { Layer } from '../../../../lib/types'
import { useState } from 'react'
import { maxPitch, minPitch } from '../../../../lib/consts'
import { restartPlayback } from '../../../../actions/restartPlayback'
import { useDebouncedLocalState } from '../../../../hooks/useDebouncedLocalState'

export const LayerControl = (p: { layer: Layer }) => {
  const [editMode, setEditMode] = useState(false)

  const [localVolume, setLocalVolume] = useDebouncedLocalState(p.layer.volume, value => {
    const layers = Layers.ref()
    const layer = layers.find(l => l.filename === p.layer.filename)
    if (!layer) return

    layer.volume = value
    Layers.set([...layers])

    restartPlayback()
  })

  const [localPitch, setLocalPitch] = useDebouncedLocalState(
    p.layer.pitch,
    value => {
      const layers = Layers.ref()
      const layer = layers.find(l => l.filename === p.layer.filename)
      if (!layer) return

      layer.pitch = value
      Layers.set([...layers])

      restartPlayback()
    },
    300
  )

  const handleDelete = () => {
    const layers = Layers.ref()
    Layers.set(layers.filter(l => l.filename !== p.layer.filename))
    restartPlayback()
  }

  const pitch = localPitch

  return (
    <>
      <HDivider />
      <Row>
        <Text key={p.layer.filename} $fullWidth>
          {p.layer.filename}
        </Text>
        <VDivider />
        {editMode ? (
          <Text onClick={() => setEditMode(false)}>‹</Text>
        ) : (
          <Text onClick={() => setEditMode(true)}>›</Text>
        )}
      </Row>
      <HDivider />
      {editMode && (
        <>
          <Row>
            <Text disabled={pitch <= minPitch} onClick={() => setLocalPitch(localPitch - 1)}>
              ‹
            </Text>
            <Text style={{ width: '90px', textAlign: 'center' }}>
              Pitch {pitch > 0 ? `+${pitch}` : pitch}
            </Text>
            <Text disabled={pitch >= maxPitch} onClick={() => setLocalPitch(localPitch + 1)}>
              ›
            </Text>
            <VDivider />
            <VDivider style={{ marginLeft: 'auto' }} />
            <Text onClick={handleDelete}>Delete</Text>
          </Row>
          <HDivider />
        </>
      )}
      <Slider min={0} max={100} value={localVolume} onInput={setLocalVolume} />
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
