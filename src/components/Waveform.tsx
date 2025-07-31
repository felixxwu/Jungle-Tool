import { Fragment } from 'react/jsx-runtime'
import type { Slice } from '../lib/types'
import styled from 'styled-components'
import { colors } from '../lib/colors'
import { useState } from 'react'

const sampleThinning = 10

export const Waveform = (p: {
  samples: Float32Array
  width: number
  height: number
  offset: number
  scaleX: number
  slices: { slice: Slice; color: string }[]
  onClick?: (sampleIndex: number) => void
  showLineOnHover?: boolean
}) => {
  const [hoverSampleIndex, setHoverSampleIndex] = useState<number | null>(null)

  const scaleX = (p.width / (p.samples.length - 1)) * p.scaleX
  const scaleY = p.height / Math.pow(2, 16)

  let path = 'M'
  for (let i = 0; i < p.samples.length; i++) {
    if (i % sampleThinning !== 0) continue
    path += `${(i + p.offset) * scaleX},${p.samples[i] * scaleY + p.height / 2} `
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const sampleIndex = Math.round(mouseX / scaleX - p.offset)
    const clampedIndex = Math.max(0, Math.min(p.samples.length - 1, sampleIndex))

    if (p.onClick) p.onClick(clampedIndex)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const sampleIndex = Math.round(mouseX / scaleX - p.offset)
    setHoverSampleIndex(sampleIndex)
  }

  return (
    <WaveformStyle
      style={{ width: p.width, height: p.height }}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverSampleIndex(null)}
      onPointerCancel={() => setHoverSampleIndex(null)}
    >
      <svg width={p.width} height={p.height}>
        <path d={path} stroke={colors.black} fill='none' strokeWidth={1} />
        {p.slices
          .concat(
            p.showLineOnHover && hoverSampleIndex !== null
              ? [
                  {
                    slice: { start: hoverSampleIndex, type: 'Hat', stepNum: 0 },
                    color: colors.black,
                  },
                ]
              : []
          )
          .map(({ slice, color }, index) => (
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
