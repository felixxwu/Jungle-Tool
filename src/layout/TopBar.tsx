import { Text } from '../components/Text'
import { VDivider } from '../components/Dividers'
import { Tab } from '../lib/store'
import { CollapsableRow } from '../components/CollapsableRow'

export const TopBar = () => {
  const tab = Tab.useState()

  return (
    <CollapsableRow
      collapse={600}
      left={
        <>
          <Text onClick={() => Tab.set('arrangement')} selected={tab === 'arrangement'}>
            Arrangement
          </Text>
          <VDivider />
          <Text onClick={() => Tab.set('library')} selected={tab === 'library'}>
            Library
          </Text>
          <VDivider />
        </>
      }
      right={
        <>
          <VDivider style={{ marginLeft: 'auto' }} />
          <Text>Volume</Text>
        </>
      }
    />
  )
}
