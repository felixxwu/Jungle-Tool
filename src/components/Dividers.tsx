import styled from 'styled-components'
import { colors } from '../lib/colors'
import { lineThickness } from '../lib/consts'

export const HDivider = styled('div')`
  width: 100%;
  height: ${lineThickness}px;
  background-color: ${colors.black};
`

export const VDivider = styled('div')`
  width: ${lineThickness}px;
  background-color: ${colors.black};
`
