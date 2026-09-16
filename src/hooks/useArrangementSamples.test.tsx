import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useArrangementSamples } from './useArrangementSamples'
import { renderOffline } from '../lib/offlineRender'
import { createFakeAudioContext } from '../test/audio-mock'

vi.mock('../lib/offlineRender', async () => {
  const actual = await vi.importActual<typeof import('../lib/offlineRender')>('../lib/offlineRender')
  return { ...actual, renderOffline: vi.fn() }
})

describe('useArrangementSamples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const ctx = createFakeAudioContext()
    ;(renderOffline as ReturnType<typeof vi.fn>).mockResolvedValue(ctx.createBuffer(2, 32, 44100))
  })

  it('returns null before the render resolves', () => {
    const { result } = renderHook(() => useArrangementSamples({ bar: 0 }))
    expect(result.current).toBeNull()
  })

  it('returns mono samples once the render resolves', async () => {
    const { result } = renderHook(() => useArrangementSamples({ bar: 0 }))
    await waitFor(() => expect(result.current).not.toBeNull())
    expect(result.current).toHaveLength(32)
  })
})
