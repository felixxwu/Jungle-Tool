import styled from 'styled-components'
import { WindowSize } from '../lib/store'
import { HDivider } from './Dividers'

export const CollapsableRow = (p: {
  left: React.ReactNode
  right: React.ReactNode
  collapse: number
}) => {
  const windowSize = WindowSize.useState()

  if (windowSize.width < p.collapse) {
    return (
      <CollapseableRowStyled>
        <Row>{p.left}</Row>
        <HDivider />
        <Row>{p.right}</Row>
      </CollapseableRowStyled>
    )
  }

  return (
    <CollapseableRowStyled>
      <Row>
        {p.left}
        {p.right}
      </Row>
    </CollapseableRowStyled>
  )
}

const CollapseableRowStyled = styled('div')`
  display: flex;
  flex-direction: column;
`

const Row = styled('div')`
  display: flex;
`
