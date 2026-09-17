import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useArrangementSamples } from './useArrangementSamples'
import { renderOffline } from '../lib/offlineRender'
import { createFakeAudioContext } from '../test/audio-mock'
import { LoadedFiles } from '../lib/store'
import type { LoadedFile } from '../lib/types'

vi.mock('../lib/offlineRender', async () => {
  const actual = await vi.importActual<typeof import('../lib/offlineRender')>('../lib/offlineRender')
  return { ...actual, renderOffline: vi.fn() }
})

describe('useArrangementSamples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([])
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

  it('re-renders once loaded files arrive after the initial render', async () => {
    const { result } = renderHook(() => useArrangementSamples({ bar: 0 }))
    await waitFor(() => expect(result.current).not.toBeNull())
    expect(renderOffline).toHaveBeenCalledTimes(1)

    act(() => {
      LoadedFiles.set([{ name: 'Amen Brother' } as LoadedFile])
    })

    await waitFor(() => expect(renderOffline).toHaveBeenCalledTimes(2))
  })
})
