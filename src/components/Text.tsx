import styled from 'styled-components'
import { colors } from '../lib/colors'

export const Text = (p: {
  children: React.ReactNode
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  $fullWidth?: boolean
}) => {
  return (
    <TextStyle
      onClick={p.disabled ? undefined : p.onClick}
      selected={p.selected}
      disabled={p.disabled}
      $fullWidth={p.$fullWidth}
    >
      {p.children}
    </TextStyle>
  )
}

const TextStyle = styled('div')<{
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  $fullWidth?: boolean
}>`
  width: ${p => (p.$fullWidth ? '100%' : 'auto')};
  color: ${p => {
    if (p.disabled) return colors.darkGrey
    if (p.selected) return colors.white
    return colors.black
  }};
  padding: 6px 15px 5px 15px;
  background-color: ${p => (p.selected ? colors.black : colors.white)};
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
