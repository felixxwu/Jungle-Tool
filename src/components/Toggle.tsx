import styled from 'styled-components'
import { colors } from '../lib/colors'

const toggleHeight = 25
const sidePadding = 15

export const Toggle = (p: {
  label: string
  checked: boolean
  onClick: () => void
  disabled?: boolean
}) => {
  return (
    <ToggleStyle onClick={p.disabled ? undefined : p.onClick} $disabled={p.disabled}>
      <Label>{p.label}</Label>
      <StatusOuter>
        <Status style={{ background: p.checked ? colors.black : colors.white }} />
      </StatusOuter>
    </ToggleStyle>
  )
}

const ToggleStyle = styled('div')<{ $disabled?: boolean }>`
  position: relative;
  height: ${toggleHeight}px;
  min-height: ${toggleHeight}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 ${sidePadding}px;
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  background: ${colors.white};
  box-sizing: border-box;
  opacity: ${p => (p.$disabled ? 0.5 : 1)};

  &:hover {
    background: ${p => (p.$disabled ? colors.white : colors.grey)};
  }
`

const Label = styled('div')`
  color: ${colors.black};
  pointer-events: none;
`

const Status = styled('div')`
  width: 6px;
  height: 6px;
  pointer-events: none;
  border: 2px solid ${colors.white};
`

const StatusOuter = styled('div')`
  border: 2px solid ${colors.black};
`
