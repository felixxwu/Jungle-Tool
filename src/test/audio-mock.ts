import { SAMPLE_RATE } from '../lib/consts'

export type ParamCall = {
  method: 'setValueAtTime' | 'linearRampToValueAtTime' | 'setTargetAtTime'
  value: number
  time: number
}

const createParam = (initial: number) => ({
  value: initial,
  calls: [] as ParamCall[],
  setValueAtTime(value: number, time: number) {
    this.value = value
    this.calls.push({ method: 'setValueAtTime', value, time })
    return this
  },
  linearRampToValueAtTime(value: number, time: number) {
    this.value = value
    this.calls.push({ method: 'linearRampToValueAtTime', value, time })
    return this
  },
  setTargetAtTime(value: number, time: number) {
    this.value = value
    this.calls.push({ method: 'setTargetAtTime', value, time })
    return this
  },
  cancelScheduledValues() {
    return this
  },
})

export type FakeGain = ReturnType<typeof createGain>
export type FakeSource = ReturnType<typeof createSource>

const createGain = () => ({
  gain: createParam(1),
  connect: (target: unknown) => target,
  disconnect: () => {},
})

const createSource = () => ({
  buffer: null as AudioBuffer | null,
  playbackRate: createParam(1),
  startedAt: null as number | null,
  stoppedAt: null as number | null,
  onended: null as (() => void) | null,
  start(time = 0) {
    this.startedAt = time
  },
  stop(time = 0) {
    this.stoppedAt = time
  },
  connect: (target: unknown) => target,
  disconnect: () => {},
})

export const createFakeAudioContext = (opts?: { sampleRate?: number }) => {
  const createdSources: FakeSource[] = []
  const createdGains: FakeGain[] = []

  return {
    state: 'running' as AudioContextState,
    sampleRate: opts?.sampleRate ?? SAMPLE_RATE,
    currentTime: 0,
    baseLatency: 0,
    outputLatency: 0,
    destination: { maxChannelCount: 2 },
    createdSources,
    createdGains,
    advance(seconds: number) {
      this.currentTime += seconds
    },
    createBufferSource() {
      const source = createSource()
      createdSources.push(source)
      return source
    },
    createGain() {
      const gain = createGain()
      createdGains.push(gain)
      return gain
    },
    createWaveShaper() {
      return {
        curve: null as Float32Array | null,
        oversample: 'none' as OverSampleType,
        connect: (target: unknown) => target,
        disconnect: () => {},
      }
    },
    createBuffer(channels: number, length: number, sampleRate: number) {
      const data = Array.from({ length: channels }, () => new Float32Array(length))
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData: (channel: number) => data[channel],
      } as unknown as AudioBuffer
    },
    resume: async () => {},
    close: async () => {},
  }
}

export type FakeAudioContext = ReturnType<typeof createFakeAudioContext>
