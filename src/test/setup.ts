import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Tone.js to avoid audio context issues in tests
vi.mock('../lib/tone', () => ({
  Tone: {
    start: vi.fn().mockResolvedValue(undefined),
    Player: vi.fn().mockImplementation(() => ({
      context: {
        decodeAudioData: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      },
      toDestination: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      loop: false,
      state: 'stopped',
      onstop: null,
    })),
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock URL.createObjectURL and revokeObjectURL
window.URL.createObjectURL = vi.fn(() => 'mocked-url')
window.URL.revokeObjectURL = vi.fn()

// Polyfill PointerEvent for jsdom (not available by default)
if (typeof PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number
    width: number
    height: number
    pressure: number
    tangentialPressure: number
    tiltX: number
    tiltY: number
    twist: number
    pointerType: string
    isPrimary: boolean

    constructor(type: string, init?: PointerEventInit) {
      super(type, init as MouseEventInit)
      this.pointerId = init?.pointerId ?? 0
      this.width = init?.width ?? 1
      this.height = init?.height ?? 1
      this.pressure = init?.pressure ?? 0
      this.tangentialPressure = init?.tangentialPressure ?? 0
      this.tiltX = init?.tiltX ?? 0
      this.tiltY = init?.tiltY ?? 0
      this.twist = init?.twist ?? 0
      this.pointerType = init?.pointerType ?? 'mouse'
      this.isPrimary = init?.isPrimary ?? true
    }
  }
  ;(window as any).PointerEvent = PointerEventPolyfill
  ;(globalThis as any).PointerEvent = PointerEventPolyfill
}
