import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportCombined } from './exportCombined'
import { renderOffline } from '../lib/offlineRender'
import { downloadAsWav } from './downloadAsWav'
import { createFakeAudioContext } from '../test/audio-mock'
import { Layers } from '../lib/store'
import type { Layer } from '../lib/types'

vi.mock('../lib/offlineRender', async () => {
  const actual = await vi.importActual<typeof import('../lib/offlineRender')>('../lib/offlineRender')
  return { ...actual, renderOffline: vi.fn() }
})
vi.mock('./downloadAsWav')

describe('exportCombined', () => {
  const layer1 = { filename: 'Amen Brother (1)', volume: 50, pitch: 0 } as Layer
  const layer2 = { filename: 'Think (About It) (1)', volume: 70, pitch: 3 } as Layer

  beforeEach(() => {
    vi.clearAllMocks()
    Layers.set([layer1, layer2])
    const ctx = createFakeAudioContext()
    ;(renderOffline as ReturnType<typeof vi.fn>).mockResolvedValue(ctx.createBuffer(2, 16, 44100))
  })

  it('renders the arrangement offline', async () => {
    await exportCombined()
    expect(renderOffline).toHaveBeenCalled()
  })

  it('downloads the rendered samples as a wav named after the layers', async () => {
    await exportCombined()
    expect(downloadAsWav).toHaveBeenCalledWith(
      expect.anything(),
      'Amen Brother (1), Think (About It) (1) (Jungle Tool)'
    )
  })

  it('forwards saturation/swing overrides to renderOffline', async () => {
    await exportCombined({ saturation: 0, swing: 0 })
    expect(renderOffline).toHaveBeenCalledWith({ saturation: 0, swing: 0 })
  })
})
