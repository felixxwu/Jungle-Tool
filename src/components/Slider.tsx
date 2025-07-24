import styled from 'styled-components'
import { useRef } from 'react'

export const Slider = (p: {
  min: number
  max: number
  value: number
  onInput: (value: number) => void
}) => {
  const sliderRef = useRef<HTMLInputElement>(null)

  // Calculate fill percentage based on BPM value (100-200 range)
  const fillPercentage = ((p.value - p.min) / (p.max - p.min)) * 100

  return (
    <SliderStyle
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
  )
}

const SliderStyle = styled('input')`
  width: 100%;
  margin: 0;
  outline: none;
  height: 15px;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  --slider-fill: 50%;

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 15px;
    background: linear-gradient(
      to right,
      black 0%,
      black var(--slider-fill),
      white var(--slider-fill),
      white 100%
    );
    border-radius: 0;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 15px;
    width: 0;
    background: transparent;
    border: none;
  }

  &::-moz-range-track {
    width: 100%;
    height: 15px;
    background: white;
    border-radius: 0;
  }

  &::-moz-range-thumb {
    height: 15px;
    width: 0;
    background: transparent;
    border: none;
  }

  &::-moz-range-progress {
    background: black;
    height: 15px;
  }
`
