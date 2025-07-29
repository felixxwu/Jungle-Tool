import { Fragment } from 'react/jsx-runtime'
import type { Slice } from '../lib/types'
import styled from 'styled-components'
import { colors } from '../lib/colors'
import { useEffect, useState } from 'react'

export const Waveform = (p: {
  samples: Float64Array
  width: number
  height: number
  offset: number
  scaleX: number
  slices: { slice: Slice; color: string }[]
  onClick?: () => void
}) => {
  const [samples, setSamples] = useState(p.samples)

  useEffect(() => {
    setTimeout(() => {
      setSamples(p.samples)
    })
  }, [p.samples])

  const scaleX = (p.width / (samples.length - 1)) * p.scaleX
  const scaleY = p.height / Math.pow(2, 16)

  let path = 'M'
  for (let i = 0; i < samples.length; i++) {
    path += `${(i + p.offset) * scaleX},${samples[i] * scaleY + p.height / 2} `
  }

  return (
    <WaveformStyle style={{ width: p.width, height: p.height }} onClick={p.onClick}>
      <svg width={p.width} height={p.height}>
        <path d={path} stroke={colors.black} fill='none' strokeWidth={1} />
        {p.slices.map(({ slice, color }, index) => (
          <Fragment key={slice.start + '-' + slice.type + '-' + index}>
            <marker
              id={`marker-${index}`}
              viewBox='0 0 10 10'
              refX='5'
              refY='5'
              markerUnits='strokeWidth'
              markerWidth='20'
              markerHeight='20'
              orient='auto'
            >
              <path d='M 0 0 L 10 5 L 0 10 z' fill={color} />
            </marker>
            <line
              x1={(slice.start + p.offset) * scaleX}
              y1={0}
              x2={(slice.start + p.offset) * scaleX}
              y2={p.height}
              stroke={color}
              strokeWidth={1}
              markerStart={`url(#marker-${index})`}
            />
          </Fragment>
        ))}
      </svg>
    </WaveformStyle>
  )
}

const WaveformStyle = styled('div')`
  background-color: ${colors.white};
`
