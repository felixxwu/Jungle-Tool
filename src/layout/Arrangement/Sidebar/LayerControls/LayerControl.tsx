import styled from 'styled-components'
import { HDivider, VDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers } from '../../../../lib/store'
import { Slider } from '../../../../components/Slider'
import type { Layer } from '../../../../lib/types'
import { useState } from 'react'
import { maxPitch, minPitch } from '../../../../lib/consts'
import { restartPlayback } from '../../../../actions/restartPlayback'

export const LayerControl = (p: { layer: Layer }) => {
  const [editMode, setEditMode] = useState(false)

  const handleVolumeChange = (volume: number) => {
    const layers = Layers.ref()
    const layer = layers.find(l => l.filename === p.layer.filename)
    if (!layer) return

    layer.volume = volume / 100
    Layers.set([...layers])

    restartPlayback()
  }

  const handleDelete = () => {
    const layers = Layers.ref()
    Layers.set(layers.filter(l => l.filename !== p.layer.filename))
  }

  const handlePitchChange = (pitch: number) => {
    const layers = Layers.ref()
    const layer = layers.find(l => l.filename === p.layer.filename)
    if (!layer) return

    layer.pitch = pitch
    Layers.set([...layers])

    restartPlayback()
  }

  const pitch = p.layer.pitch

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
        <Row>
          <Text disabled={pitch <= minPitch} onClick={() => handlePitchChange(p.layer.pitch - 1)}>
            ‹
          </Text>
          <Text style={{ width: '90px', textAlign: 'center' }}>
            Pitch {pitch > 0 ? `+${pitch}` : pitch}
          </Text>
          <Text disabled={pitch >= maxPitch} onClick={() => handlePitchChange(p.layer.pitch + 1)}>
            ›
          </Text>
          <VDivider />
          <VDivider style={{ marginLeft: 'auto' }} />
          <Text onClick={handleDelete}>Delete</Text>
        </Row>
      )}
      <HDivider />
      <Slider
        min={0}
        max={100}
        value={p.layer.volume * 100}
        onInput={value => handleVolumeChange(value)}
      />
    </>
  )
}

const Row = styled('div')`
  display: flex;
`
