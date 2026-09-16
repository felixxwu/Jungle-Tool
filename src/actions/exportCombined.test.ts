import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportCombined } from './exportCombined'
import { renderOffline } from '../lib/offlineRender'
import { downloadAsWav } from './downloadAsWav'
import { createFakeAudioContext } from '../test/audio-mock'

vi.mock('../lib/offlineRender', async () => {
  const actual = await vi.importActual<typeof import('../lib/offlineRender')>('../lib/offlineRender')
  return { ...actual, renderOffline: vi.fn() }
})
vi.mock('./downloadAsWav')

describe('exportCombined', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const ctx = createFakeAudioContext()
    ;(renderOffline as ReturnType<typeof vi.fn>).mockResolvedValue(ctx.createBuffer(2, 16, 44100))
  })

  it('renders the arrangement offline', async () => {
    await exportCombined()
    expect(renderOffline).toHaveBeenCalled()
  })

  it('downloads the rendered samples as a wav', async () => {
    await exportCombined()
    expect(downloadAsWav).toHaveBeenCalledWith(expect.anything(), 'Jungle Tool Break')
  })
})
