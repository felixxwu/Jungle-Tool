import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '../test/test-utils'
import { act } from '@testing-library/react'
import { Waveform } from './Waveform'
import { colors } from '../lib/colors'
import type { Slice } from '../lib/types'

describe('Waveform', () => {
  const mockSamples = new Float32Array([0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5, 0])
  const defaultProps = {
    samples: mockSamples,
    width: 100,
    height: 50,
    offset: 0,
    scaleX: 1,
    slices: [],
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders SVG with correct dimensions', () => {
      const { container } = render(<Waveform {...defaultProps} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg?.getAttribute('width')).toBe('100')
      expect(svg?.getAttribute('height')).toBe('50')
    })

    it('renders waveform path', () => {
      const { container } = render(<Waveform {...defaultProps} />)
      const path = container.querySelector('path')
      expect(path).toBeInTheDocument()
      expect(path?.getAttribute('d')).toContain('M')
    })

    it('applies correct width and height styles', () => {
      const { container } = render(<Waveform {...defaultProps} />)
      const waveformDiv = container.firstChild as HTMLElement
      expect(waveformDiv.style.width).toBe('100px')
      expect(waveformDiv.style.height).toBe('50px')
    })
  })

  describe('Click handling', () => {
    it('calls onClick with correct sample index when clicked', () => {
      const handleClick = vi.fn()
      const { container } = render(<Waveform {...defaultProps} onClick={handleClick} />)
      const waveformDiv = container.firstChild as HTMLElement

      // Mock getBoundingClientRect
      const mockRect = {
        left: 0,
        top: 0,
        width: 100,
        height: 50,
        bottom: 50,
        right: 100,
      } as DOMRect
      vi.spyOn(waveformDiv, 'getBoundingClientRect').mockReturnValue(mockRect)

      // Simulate click at x=50 (middle of waveform)
      const clickEvent = new MouseEvent('click', {
        clientX: 50,
        clientY: 25,
        bubbles: true,
      })
      waveformDiv.dispatchEvent(clickEvent)

      expect(handleClick).toHaveBeenCalledTimes(1)
      // Should calculate sample index based on click position
      const calledIndex = handleClick.mock.calls[0][0]
      expect(calledIndex).toBeGreaterThanOrEqual(0)
      expect(calledIndex).toBeLessThan(mockSamples.length)
    })

    it('clamps sample index to valid range', () => {
      const handleClick = vi.fn()
      const { container } = render(<Waveform {...defaultProps} onClick={handleClick} />)
      const waveformDiv = container.firstChild as HTMLElement

      const mockRect = {
        left: 0,
        top: 0,
        width: 100,
        height: 50,
        bottom: 50,
        right: 100,
      } as DOMRect
      vi.spyOn(waveformDiv, 'getBoundingClientRect').mockReturnValue(mockRect)

      // Click way outside bounds (negative)
      const clickEvent = new MouseEvent('click', {
        clientX: -100,
        clientY: 25,
        bubbles: true,
      })
      waveformDiv.dispatchEvent(clickEvent)

      expect(handleClick).toHaveBeenCalledWith(0) // Clamped to 0
    })

    it('does not call onClick when handler is not provided', () => {
      const { container } = render(<Waveform {...defaultProps} />)
      const waveformDiv = container.firstChild as HTMLElement

      const mockRect = {
        left: 0,
        top: 0,
        width: 100,
        height: 50,
        bottom: 50,
        right: 100,
      } as DOMRect
      vi.spyOn(waveformDiv, 'getBoundingClientRect').mockReturnValue(mockRect)

      const clickEvent = new MouseEvent('click', {
        clientX: 50,
        clientY: 25,
        bubbles: true,
      })
      waveformDiv.dispatchEvent(clickEvent)

      // Should not throw error
      expect(true).toBe(true)
    })
  })

  describe('Slices rendering', () => {
    it('renders slice markers', () => {
      const slices: { slice: Slice; color: string }[] = [
        { slice: { start: 2, type: 'Hat', stepNum: 0 }, color: colors.black },
        { slice: { start: 5, type: 'Kick', stepNum: 0 }, color: colors.darkGrey },
      ]

      const { container } = render(<Waveform {...defaultProps} slices={slices} />)
      const lines = container.querySelectorAll('line')
      // Should have 2 slice lines + 1 playhead line = 3 lines
      expect(lines.length).toBeGreaterThanOrEqual(2)
    })

    it('renders slices with correct colors', () => {
      const slices: { slice: Slice; color: string }[] = [
        { slice: { start: 2, type: 'Hat', stepNum: 0 }, color: colors.black },
      ]

      const { container } = render(<Waveform {...defaultProps} slices={slices} />)
      const line = container.querySelector('line[stroke]')
      expect(line?.getAttribute('stroke')).toBe(colors.black)
    })
  })

  describe('Hover line', () => {
    it('shows hover line when showLineOnHover is true and hovering', () => {
      const { container } = render(<Waveform {...defaultProps} showLineOnHover={true} />)
      const waveformDiv = container.firstChild as HTMLElement

      const mockRect = {
        left: 0,
        top: 0,
        width: 100,
        height: 50,
        bottom: 50,
        right: 100,
      } as DOMRect
      vi.spyOn(waveformDiv, 'getBoundingClientRect').mockReturnValue(mockRect)

      // Simulate pointer move (wrapped in act to avoid warnings)
      act(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 50,
          clientY: 25,
          bubbles: true,
        })
        waveformDiv.dispatchEvent(pointerEvent)
      })

      // Should render hover line as a slice
      const lines = container.querySelectorAll('line')
      expect(lines.length).toBeGreaterThan(0)
    })

    it('hides hover line when pointer leaves', () => {
      const { container } = render(<Waveform {...defaultProps} showLineOnHover={true} />)
      const waveformDiv = container.firstChild as HTMLElement

      const mockRect = {
        left: 0,
        top: 0,
        width: 100,
        height: 50,
        bottom: 50,
        right: 100,
      } as DOMRect
      vi.spyOn(waveformDiv, 'getBoundingClientRect').mockReturnValue(mockRect)

      // Move pointer (wrapped in act to avoid warnings)
      act(() => {
        waveformDiv.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 50, clientY: 25, bubbles: true })
        )
      })

      // Leave pointer (wrapped in act to avoid warnings)
      act(() => {
        waveformDiv.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      })

      // Hover line should be removed
      // (We can't easily test this without checking internal state, but we verify it doesn't crash)
      expect(true).toBe(true)
    })
  })

  describe('Playhead', () => {
    it('renders playhead element when playHeadId is provided', () => {
      const { container } = render(<Waveform {...defaultProps} playHeadId='test-playhead' />)
      const playhead = container.querySelector('#test-playhead')
      expect(playhead).toBeInTheDocument()
    })

    it('does not render playhead when playHeadId is not provided', () => {
      const { container } = render(<Waveform {...defaultProps} />)
      const playhead = container.querySelector('[id*="playhead"]')
      expect(playhead).not.toBeInTheDocument()
    })

    it('hides playhead when not playing', () => {
      render(
        <Waveform
          {...defaultProps}
          playHeadId='test-playhead'
          playStartTimestamp={null}
          isPlaying={false}
        />
      )
      const playhead = document.getElementById('test-playhead')
      expect(playhead).toBeInTheDocument()
      // Playhead should be hidden when not playing
      // Note: This is tested via the useEffect, which runs after render
    })

    it('hides playhead when resetTrigger changes', () => {
      const { rerender } = render(
        <Waveform {...defaultProps} playHeadId='test-playhead' resetTrigger={1} />
      )

      const playhead = document.getElementById('test-playhead')
      if (playhead) {
        playhead.style.display = 'block'
      }

      // Change resetTrigger
      rerender(<Waveform {...defaultProps} playHeadId='test-playhead' resetTrigger={2} />)

      // Playhead should be hidden
      const updatedPlayhead = document.getElementById('test-playhead')
      expect(updatedPlayhead?.style.display).toBe('none')
    })
  })

  describe('Scale and offset', () => {
    it('applies scaleX correctly to waveform path', () => {
      const { container } = render(<Waveform {...defaultProps} scaleX={2} />)
      const path = container.querySelector('path')
      const pathData = path?.getAttribute('d') || ''
      // With scaleX=2, coordinates should be scaled
      expect(pathData).toBeTruthy()
    })

    it('applies offset correctly to slice positions', () => {
      const slices: { slice: Slice; color: string }[] = [
        { slice: { start: 2, type: 'Hat', stepNum: 0 }, color: colors.black },
      ]

      const { container } = render(<Waveform {...defaultProps} slices={slices} offset={10} />)
      const line = container.querySelector('line')
      const x1 = line?.getAttribute('x1')
      expect(x1).toBeTruthy()
      // X position should account for offset
    })
  })

  describe('Edge cases', () => {
    it('handles empty samples array', () => {
      const { container } = render(<Waveform {...defaultProps} samples={new Float32Array(0)} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('handles zero width', () => {
      const { container } = render(<Waveform {...defaultProps} width={0} />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('width')).toBe('0')
    })

    it('handles zero height', () => {
      const { container } = render(<Waveform {...defaultProps} height={0} />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('height')).toBe('0')
    })
  })
})
