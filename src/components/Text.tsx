import styled from 'styled-components'
import { colors } from '../lib/colors'
import { largeTextHeight } from '../lib/consts'

export const Text = (p: {
  children: React.ReactNode
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  style?: React.CSSProperties
  big?: boolean
}) => {
  return (
    <TextStyle
      onClick={p.disabled ? undefined : p.onClick}
      selected={p.selected}
      disabled={p.disabled}
      $fullWidth={p.fullWidth}
      onPointerEnter={p.onPointerEnter}
      onPointerLeave={p.onPointerLeave}
      onPointerCancel={p.onPointerLeave}
      style={p.style}
      $big={p.big}
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
  $big?: boolean
}>`
  width: ${p => (p.$fullWidth ? '100%' : 'auto')};
  padding: 6px 15px 5px 15px;
  background-color: ${p => (p.selected ? colors.black : colors.white)};
  white-space: nowrap;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  ${p => p.$big && `height: ${largeTextHeight}px;`}
  ${p => p.$big && `min-height: ${largeTextHeight}px;`}

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
    @media (hover: hover) {
      background-color: ${p => {
        if (p.selected) return colors.black
        if (p.onClick) return colors.grey
        return colors.white
      }};
    }
  }

  &:active {
    @media (hover: none) {
      background-color: ${p => {
        if (p.selected) return colors.black
        if (p.onClick) return colors.grey
        return colors.white
      }};
    }
  }
`
