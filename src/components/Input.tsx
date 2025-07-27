import styled from 'styled-components'
import { colors } from '../lib/colors'

export const Input = (p: {
  value: string
  onChange: (value: string) => void
  selected?: boolean
  disabled?: boolean
  $fullWidth?: boolean
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}) => {
  return (
    <InputStyle
      value={p.value}
      onChange={e => p.onChange(e.target.value)}
      selected={p.selected}
      disabled={p.disabled}
      $fullWidth={p.$fullWidth}
      onPointerEnter={p.onPointerEnter}
      onPointerLeave={p.onPointerLeave}
      onPointerCancel={p.onPointerLeave}
    />
  )
}

const InputStyle = styled('input')<{
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  $fullWidth?: boolean
}>`
  width: ${p => (p.$fullWidth ? '100%' : 'auto')};
  padding: 6px 15px 5px 15px;
  background-color: ${p => (p.selected ? colors.black : colors.white)};
  white-space: nowrap;
  color: ${p => {
    if (p.disabled) return colors.darkGrey
    if (p.selected) return colors.white
    return colors.black
  }};
  cursor: ${p => {
    if (p.disabled) return 'default'
    if (p.onClick) return 'pointer'
    return 'default'
  }};

  &:hover {
    background-color: ${p => {
      if (p.selected) return colors.black
      if (p.onClick) return colors.grey
      return colors.white
    }};
  }
`
