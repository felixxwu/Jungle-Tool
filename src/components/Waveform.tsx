import { Fragment } from 'react/jsx-runtime'
import type { Slice } from '../lib/types'
import styled from 'styled-components'
import { colors } from '../lib/colors'
import { useState, useEffect, useRef } from 'react'

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
  playHeadId?: string
  playStartTimestamp?: number | null
  playDuration?: number // Duration in milliseconds
  isPlaying?: boolean
  resetTrigger?: any // Dependency that should reset playhead
  // Bar-specific playback props (for arrangement view)
  selectedBarIndex?: number
  totalBars?: number
  barDuration?: number // Duration of each bar in milliseconds
}) => {
  const [hoverSampleIndex, setHoverSampleIndex] = useState<number | null>(null)
  const prevProgress = useRef<number>(1000)

  // Hide playhead when resetTrigger changes or playback stops
  useEffect(() => {
    if (p.playHeadId) {
      const playHead = document.getElementById(p.playHeadId)
      if (playHead) {
        playHead.style.display = 'none'
      }
    }
  }, [p.resetTrigger, p.playHeadId, p.playStartTimestamp])

  // Animate playhead during playback
  useEffect(() => {
    if (!p.playHeadId) {
      return
    }

    // If not playing, ensure playhead is hidden and don't start interval
    if (!p.playStartTimestamp || !p.isPlaying) {
      const playHead = document.getElementById(p.playHeadId)
      if (playHead) {
        playHead.style.display = 'none'
      }
      return
    }

    const intervalId = setInterval(() => {
      const playHead = document.getElementById(p.playHeadId!)

      // Primary check: if no play timestamp, hide playhead immediately
      if (!p.playStartTimestamp) {
        if (playHead) {
          playHead.style.display = 'none'
        }
        return
      }

      // Secondary check: if not playing according to player state
      if (!p.isPlaying) {
        if (playHead) {
          playHead.style.display = 'none'
        }
        return
      }

      // Handle bar-specific playback (arrangement view)
      if (
        p.selectedBarIndex !== undefined &&
        p.totalBars !== undefined &&
        p.barDuration !== undefined
      ) {
        const elapsed = Date.now() - p.playStartTimestamp
        const arrangementDuration = p.barDuration * p.totalBars

        // Calculate progress within the current bar
        const barProgress = elapsed % p.barDuration

        // Calculate which bar is currently playing in the full arrangement
        const currentPlayingBar = Math.floor((elapsed % arrangementDuration) / p.barDuration)

        // Only show playhead if the currently playing bar matches the selected bar
        if (currentPlayingBar !== p.selectedBarIndex) {
          if (playHead) {
            playHead.style.display = 'none'
          }
          return
        }

        // Check if we need to start a new bar animation
        const progressDiff = barProgress - prevProgress.current
        prevProgress.current = barProgress

        if (progressDiff < 0 && playHead) {
          playHead.style.display = 'block'
          playHead.animate([{ transform: 'translateX(0%)' }, { transform: 'translateX(100%)' }], {
            duration: p.barDuration,
            iterations: 1,
          })
        }
      }
      // Handle simple playback (library view)
      else if (p.playDuration) {
        const elapsed = Date.now() - p.playStartTimestamp

        // Check if playback has finished naturally
        if (elapsed > p.playDuration) {
          if (playHead) {
            playHead.style.display = 'none'
          }
          return
        }

        const progress = elapsed % p.playDuration

        // Check if we need to start a new animation
        const progressDiff = progress - prevProgress.current
        prevProgress.current = progress

        if (progressDiff < 0 && playHead) {
          playHead.style.display = 'block'
          playHead.animate([{ transform: 'translateX(0%)' }, { transform: 'translateX(100%)' }], {
            duration: p.playDuration,
            iterations: 1,
          })
        }
      }
    }, 16) // ~60fps

    return () => clearInterval(intervalId)
  }, [
    p.playHeadId,
    p.playStartTimestamp,
    p.playDuration,
    p.isPlaying,
    p.selectedBarIndex,
    p.totalBars,
    p.barDuration,
  ])

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

        <line
          id={p.playHeadId}
          x1={0}
          y1={0}
          x2={0}
          y2={p.height}
          stroke={colors.black}
          strokeWidth={1}
        />
      </svg>
    </WaveformStyle>
  )
}

const WaveformStyle = styled('div')`
  background-color: ${colors.white};
`
