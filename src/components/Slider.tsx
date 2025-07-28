import styled from 'styled-components'
import { useRef } from 'react'
import { colors } from '../lib/colors'

const sliderHeight = 23
const sidePadding = 15

export const Slider = (p: {
  min: number
  max: number
  value: number
  onInput: (value: number) => void
  label: string
}) => {
  const sliderRef = useRef<HTMLInputElement>(null)

  const fillPercentage = ((p.value - p.min) / (p.max - p.min)) * 100

  return (
    <SliderStyle>
      <Label style={fillPercentage >= 50 ? { left: sidePadding } : { right: sidePadding }}>
        {p.label}
      </Label>
      <SliderInput
        ref={sliderRef}
        type='range'
        min={p.min}
        max={p.max}
        value={p.value}
        style={{ '--slider-fill': `${fillPercentage}%` } as React.CSSProperties}
        onInput={e => {
          const target = e.target as HTMLInputElement
          p.onInput(parseInt(target.value))
        }}
      />
    </SliderStyle>
  )
}

const SliderStyle = styled('div')`
  position: relative;
  height: ${sliderHeight}px;
  display: flex;
  align-items: center;
  width: 100%;
`

const Label = styled('div')`
  position: absolute;
  margin-top: 1px;
  pointer-events: none;
`

const SliderInput = styled('input')`
  width: 100%;
  margin: 0;
  outline: none;
  height: ${sliderHeight}px;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  --slider-fill: 50%;

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: ${sliderHeight}px;
    background: linear-gradient(
      to right,
      ${colors.darkGrey} 0%,
      ${colors.darkGrey} var(--slider-fill),
      white var(--slider-fill),
      white 100%
    );
    border-radius: 0;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: ${sliderHeight}px;
    width: 10px;
    background: ${colors.black};
    border: none;
  }

  &::-moz-range-track {
    width: 100%;
    height: ${sliderHeight}px;
    background: white;
    border-radius: 0;
  }

  &::-moz-range-thumb {
    height: ${sliderHeight}px;
    width: 10px;
    background: ${colors.darkGrey};
    border: none;
  }

  &::-moz-range-progress {
    background: ${colors.darkGrey};
    height: ${sliderHeight}px;
  }
`
