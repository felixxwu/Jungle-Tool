import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { createFakeAudioContext } from './audio-mock'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// jsdom has no Web Audio. Provide a constructible default so modules that
// create a context at call time work without each test wiring its own.
;(globalThis as any).AudioContext = vi
  .fn()
  .mockImplementation(() => createFakeAudioContext())
;(globalThis as any).OfflineAudioContext = vi
  .fn()
  .mockImplementation((channels: number, length: number, sampleRate: number) => ({
    ...createFakeAudioContext({ sampleRate }),
    length,
    numberOfChannels: channels,
    startRendering: async () => createFakeAudioContext().createBuffer(channels, length, sampleRate),
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

// Mock Element.animate for playhead animations
if (!Element.prototype.animate) {
  Element.prototype.animate = vi.fn(() => ({
    cancel: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    updatePlaybackRate: vi.fn(),
    currentTime: 0,
    effect: null,
    finished: Promise.resolve(),
    id: '',
    oncancel: null,
    onfinish: null,
    onremove: null,
    pending: false,
    playbackRate: 1,
    playState: 'idle' as AnimationPlayState,
    ready: Promise.resolve(),
    replaceState: 'active' as AnimationReplaceState,
    startTime: null,
    timeline: null,
    commitStyles: vi.fn(),
    persist: vi.fn(),
  })) as any
}

// Mock Firebase so tests don't require real project credentials
vi.mock('../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
}))
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({ docs: [] })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

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
