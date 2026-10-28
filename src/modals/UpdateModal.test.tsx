import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '../test/test-utils'
import { UpdateModal } from './UpdateModal'
import { callNative } from '../lib/plugin'
import { Modal } from '../lib/store'

let progressListener: ((fraction: number) => void) | null = null

vi.mock('../lib/plugin', () => ({
  callNative: vi.fn(),
  onPluginEvent: vi.fn((_name: string, listener: (fraction: number) => void) => {
    progressListener = listener
  }),
}))

describe('UpdateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Modal.set(<div />)
  })

  it('downloads and opens the installer when Update is pressed', async () => {
    let finish: (result: string) => void = () => {}
    vi.mocked(callNative).mockImplementation(() => new Promise(resolve => (finish = resolve)))
    render(<UpdateModal version='0.2.0' />)

    expect(screen.getByText(/0\.2\.0/)).toBeInTheDocument()
    await act(async () => screen.getByText('Update').click())
    expect(callNative).toHaveBeenCalledWith('startUpdate')

    await act(async () => progressListener?.(0.42))
    expect(screen.getByText(/42%/)).toBeInTheDocument()

    await act(async () => finish('opened'))
    expect(screen.getByText(/installer is open/i)).toBeInTheDocument()
  })

  it('remembers Later for the rest of the session', async () => {
    vi.mocked(callNative).mockResolvedValue(undefined)
    render(<UpdateModal version='0.2.0' />)
    await act(async () => screen.getByText('Later').click())
    expect(callNative).toHaveBeenCalledWith('dismissUpdate')
    expect(Modal.ref()).toBe(null)
  })

  it('says so when the download fails', async () => {
    vi.mocked(callNative).mockResolvedValue('failed')
    render(<UpdateModal version='0.2.0' />)
    await act(async () => screen.getByText('Update').click())
    expect(screen.getByText(/couldn't download/i)).toBeInTheDocument()
  })
})
