import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportLayer } from './exportLayer'
import { renderOffline } from '../lib/offlineRender'
import { downloadAsWav } from './downloadAsWav'
import { createFakeAudioContext } from '../test/audio-mock'
import type { Layer } from '../lib/types'

vi.mock('../lib/offlineRender', async () => {
  const actual = await vi.importActual<typeof import('../lib/offlineRender')>('../lib/offlineRender')
  return { ...actual, renderOffline: vi.fn() }
})
vi.mock('./downloadAsWav')

describe('exportLayer', () => {
  const layer = { filename: 'Amen', volume: 100, pitch: 0 } as Layer

  beforeEach(() => {
    vi.clearAllMocks()
    const ctx = createFakeAudioContext()
    ;(renderOffline as ReturnType<typeof vi.fn>).mockResolvedValue(ctx.createBuffer(2, 16, 44100))
  })

  it('renders only the given layer offline', async () => {
    await exportLayer(layer)
    expect(renderOffline).toHaveBeenCalledWith({ layers: [layer] })
  })

  it('downloads the rendered samples as a wav', async () => {
    await exportLayer(layer)
    expect(downloadAsWav).toHaveBeenCalledWith(expect.anything(), 'Amen (Jungle Tool)')
  })

  it('forwards saturation/swing overrides to renderOffline', async () => {
    await exportLayer(layer, { saturation: 0, swing: 0 })
    expect(renderOffline).toHaveBeenCalledWith({ saturation: 0, swing: 0, layers: [layer] })
  })
})
