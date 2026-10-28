import { SAMPLE_RATE } from './consts'
import { HostBpm, HostPlaying, NumBars, Playing } from './store'
import type { Layer } from './types'

// Talks to the JUCE plugin that hosts this UI when it's built with `vite build --mode plugin`.
export const IS_PLUGIN = import.meta.env.MODE === 'plugin'

type JuceBackend = {
  emitEvent: (name: string, payload: unknown) => void
  addEventListener: <T>(name: string, listener: (payload: T) => void) => void
}

declare global {
  interface Window {
    __JUCE__?: { backend: JuceBackend }
  }
}

// The plugin has 8 layer slots, one per pair of volume and pitch parameters in the DAW.
export const isLayerLimitReached = (layers: Layer[]) =>
  IS_PLUGIN && layers.filter(l => !l.temp).length >= 8

// Stands in for the AudioBufferSourceNode a Library preview gets in the web app.
export const playPluginPreview = (breakName: string, start: number, end: number, loop: boolean) => {
  callNative('playPreview', breakName, start, end, loop)
  const source = {
    onended: null as (() => void) | null,
    stop: () => {
      clearTimeout(timer)
      callNative('stopPreview')
    },
  }
  const timer = loop
    ? undefined
    : setTimeout(() => source.onended?.(), ((end - start) / SAMPLE_RATE) * 1000)
  return source as unknown as AudioBufferSourceNode
}

// Opens the plugin's native file chooser and returns the chosen file's name and contents.
export const pickFile = async (patterns: string) => {
  const result = await callNative<{ name: string; base64: string } | null>('chooseFile', patterns)
  if (!result) return null
  const bytes = Uint8Array.from(atob(result.base64), c => c.charCodeAt(0))
  return { name: result.name, bytes: bytes.buffer }
}

const pending = new Map<number, (result: unknown) => void>()
let nextId = 0

export const callNative = <T = unknown>(name: string, ...params: unknown[]): Promise<T> => {
  const backend = window.__JUCE__!.backend
  if (nextId === 0) {
    backend.addEventListener<{ promiseId: number; result: unknown }>(
      '__juce__complete',
      ({ promiseId, result }) => {
        pending.get(promiseId)?.(result)
        pending.delete(promiseId)
      }
    )
  }
  const id = nextId++
  return new Promise(resolve => {
    pending.set(id, resolve as (result: unknown) => void)
    backend.emitEvent('__juce__invoke', { name, params, resultId: id })
  })
}

type Transport = {
  position: number
  bpm: number
  hostPlaying: boolean
  auditioning: boolean
  hostBpm?: number
}

let transport: Transport | null = null
let transportReceivedAt = 0

export const onPluginEvent = <T>(name: string, listener: (payload: T) => void) =>
  window.__JUCE__!.backend.addEventListener<T>(name, listener)

// The plugin reports the transport about 30 times a second.
export const listenToTransport = () => {
  onPluginEvent<Transport>('transport', next => {
    transport = next
    transportReceivedAt = performance.now()
    // Only real changes, so the UI doesn't re-render 30 times a second.
    const setIfChanged = <T>(store: { ref: () => T; set: (value: T) => void }, value: T) => {
      if (store.ref() !== value) store.set(value)
    }
    setIfChanged(Playing, next.auditioning || next.hostPlaying)
    setIfChanged(HostPlaying, next.hostPlaying)
    setIfChanged(HostBpm, next.hostBpm ?? null)
  })
}

// Same shape as getLoopPosition, moved on from the last report so the play-head runs smoothly.
export const getPluginLoopPosition = () => {
  if (!transport || transport.position < 0) return null
  const steps = NumBars.ref() * 16
  const elapsedSteps = ((performance.now() - transportReceivedAt) / 1000) * (transport.bpm / 60) * 4
  const step = (transport.position + elapsedSteps) % steps
  return { bar: Math.floor(step / 16), step: Math.floor(step) % 16, fraction: step / steps }
}
