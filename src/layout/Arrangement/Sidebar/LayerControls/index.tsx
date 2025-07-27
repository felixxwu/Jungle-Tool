import { HDivider } from '../../../../components/Dividers'
import { Text } from '../../../../components/Text'
import { Layers, Tab } from '../../../../lib/store'
import { LayerControl } from './LayerControl'

export const LayerControls = () => {
  const layers = Layers.useState()

  return (
    <>
      {layers.map(layer => (
        <LayerControl key={layer.filename} layer={layer} />
      ))}
      <HDivider />
      <Text onClick={() => Tab.set('library')}>Add Layer +</Text>
    </>
  )
}
