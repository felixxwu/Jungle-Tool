# Web Audio Realtime Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the offline full-buffer re-render and `Tone.Player` loop with a Web Audio graph driven by a lookahead scheduler, so edits apply mid-loop without restarting playback.

**Architecture:** A pure planning function (`getScheduledNotes`) turns store state into a list of plain `ScheduledNote` descriptions; a thin imperative layer turns those into `AudioBufferSourceNode`s. The same planning output feeds the live `AudioContext` and an `OfflineAudioContext` used for export and waveform drawing. Class A edits (notes, volume, pitch, saturation, toggles) are picked up on the next 25 ms scheduler tick; Class B edits (BPM, swing, bar count) are snapshotted once per loop pass.

**Tech Stack:** React 19, TypeScript, Vite, vitest + jsdom, `wavefile` (retained for import/export only), Web Audio API. `tone` is removed by the final task.

**Spec:** `docs/superpowers/specs/2026-09-16-web-audio-scheduling-design.md`

## Global Constraints

- `SAMPLE_RATE` is `44100` (`src/lib/consts.ts:6`). All contexts are created at this rate.
- `LoadedFile.samples` are `[Float32Array, Float32Array]` in **16-bit integer scale** (±2^15), not ±1. Divide by `2 ** 15` on the way into an `AudioBuffer`; multiply by `32767` on the way back out to `wavefile`. This asymmetry is deliberate — do not make it symmetric.
- Lookahead window is 100 ms; scheduler tick is 25 ms.
- `WaveShaperNode` curve: 4096 points, `oversample: '4x'`.
- Master trim gain: `0.3` (new constant `masterTrim` in `src/lib/consts.ts`).
- jsdom has no Web Audio. `src/lib/audioContext.ts` must never touch `window.AudioContext` at module load — only inside a function call.
- Existing code style: no semicolons, single quotes, arrow-function exports, `p:` object params for multi-arg functions, tests colocated as `*.test.ts(x)`.
- Run the full suite with `npm run test:run`. A single file: `npx vitest run src/path/file.test.ts`.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `src/test/audio-mock.ts` | Fake `AudioContext` / `OfflineAudioContext` recording nodes and `AudioParam` calls. |
| `src/lib/audioContext.ts` | Lazy singleton `AudioContext` + `resumeAudioContext()`. |
| `src/lib/saturationCurve.ts` | Pure `WaveShaperNode` curve builder (±1 domain). |
| `src/lib/audioBuffers.ts` | Slice → `AudioBuffer`, cached on slice boundaries + Fill Gaps. |
| `src/helpers/getStepSeconds.ts` | Step duration in seconds (the seconds-domain sibling of `getStepSize`). |
| `src/helpers/getScheduledNotes.ts` | **Pure core.** Store state + step range → `ScheduledNote[]`. |
| `src/lib/graph.ts` | `buildGraph(ctx)` → layer gains (keyed by filename), shaper, trim. |
| `src/lib/scheduler.ts` | Lookahead loop, Class B snapshot, two clocks, `getLoopPosition()`. |
| `src/lib/offlineRender.ts` | `renderOffline()` via `OfflineAudioContext`, with wrap-around tail fold. |

**Modified**

`src/lib/store.ts` (drop `Player`, add `PreviewSource`), `src/lib/playback.ts` (split stop), `src/lib/consts.ts`, `src/test/setup.ts`, `src/actions/playArrangement.ts`, `addToArrangement.ts`, `randomiseLayers.ts`, `exportCombined.ts`, `exportLayer.ts`, `playSlice.ts`, `playFile.ts`, `playTrim.ts`, `src/hooks/useArrangementSamples.ts`, `useArrangementStates.ts`, `src/components/Waveform.tsx`, `src/layout/Arrangement/Main/ArragementWaveform/index.tsx`, `BarSelection/index.tsx`, `BottomBar/index.tsx`, `src/hooks/useWindowListeners.ts`, `src/layout/Library/FileEditor/LibraryWaveform.tsx`, `TrimEditor.tsx`.

**Deleted**

`src/lib/tone.ts`, `src/actions/restartPlayback.ts`, `src/hooks/useRestartPlayback.ts`, `src/helpers/getArrangementSamples.ts`, `getArrangementLayerSamples.ts`, `getPitchAdjustedSliceSamples.ts` (and their tests), `restartPlayback.test.ts`, `useRestartPlayback.test.tsx`.

---

## Task 1: Fake Web Audio context for tests

**Files:**
- Create: `src/test/audio-mock.ts`
- Modify: `src/test/setup.ts`
- Test: `src/test/audio-mock.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `createFakeAudioContext(opts?: { sampleRate?: number }): FakeAudioContext`, where `FakeAudioContext` has `currentTime: number`, `advance(seconds: number): void`, `createdSources: FakeSource[]`, `createdGains: FakeGain[]`, `destination`, `createBufferSource()`, `createGain()`, `createWaveShaper()`, `createBuffer(ch, len, rate)`, `baseLatency`, `outputLatency`, `resume()`, `state`. `FakeGain.gain.calls: ParamCall[]` where `ParamCall = { method: 'setValueAtTime' | 'linearRampToValueAtTime' | 'setTargetAtTime'; value: number; time: number }`. `FakeSource` has `buffer`, `playbackRate: { value: number }`, `startedAt: number | null`, `stoppedAt: number | null`, `connect()`, `disconnect()`.

- [ ] **Step 1: Write the failing test**

```ts
// src/test/audio-mock.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeAudioContext } from './audio-mock'

describe('createFakeAudioContext', () => {
  it('advances currentTime', () => {
    const ctx = createFakeAudioContext()
    expect(ctx.currentTime).toBe(0)
    ctx.advance(0.5)
    expect(ctx.currentTime).toBe(0.5)
  })

  it('records started sources with their playbackRate', () => {
    const ctx = createFakeAudioContext()
    const source = ctx.createBufferSource()
    source.playbackRate.value = 2
    source.start(1.25)
    expect(ctx.createdSources).toHaveLength(1)
    expect(ctx.createdSources[0].startedAt).toBe(1.25)
    expect(ctx.createdSources[0].playbackRate.value).toBe(2)
  })

  it('records AudioParam scheduling calls on gains', () => {
    const ctx = createFakeAudioContext()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1, 0.5)
    gain.gain.linearRampToValueAtTime(0, 0.7)
    expect(gain.gain.calls).toEqual([
      { method: 'setValueAtTime', value: 1, time: 0.5 },
      { method: 'linearRampToValueAtTime', value: 0, time: 0.7 },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/audio-mock.test.ts`
Expected: FAIL — cannot resolve `./audio-mock`.

- [ ] **Step 3: Write the implementation**

```ts
// src/test/audio-mock.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/audio-mock.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Register a default global in setup.ts**

Add to `src/test/setup.ts`, immediately after the existing Tone mock (leave the Tone mock in place — it is removed in Task 17):

```ts
import { createFakeAudioContext } from './audio-mock'

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
```

- [ ] **Step 6: Run the full suite and commit**

Run: `npm run test:run`
Expected: PASS — no existing test should change behaviour.

```bash
git add src/test/audio-mock.ts src/test/audio-mock.test.ts src/test/setup.ts
git commit -m "test: add fake Web Audio context for tests"
```

---

## Task 2: Lazy AudioContext singleton

**Files:**
- Create: `src/lib/audioContext.ts`
- Test: `src/lib/audioContext.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `getAudioContext(): AudioContext`, `resumeAudioContext(): Promise<void>`, `resetAudioContext(): void` (test-only reset of the singleton).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/audioContext.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getAudioContext, resumeAudioContext, resetAudioContext } from './audioContext'
import { SAMPLE_RATE } from './consts'

describe('audioContext', () => {
  beforeEach(() => resetAudioContext())

  it('returns the same instance on repeated calls', () => {
    expect(getAudioContext()).toBe(getAudioContext())
  })

  it('creates the context at the project sample rate', () => {
    expect(getAudioContext().sampleRate).toBe(SAMPLE_RATE)
  })

  it('resumes without throwing', async () => {
    await expect(resumeAudioContext()).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/audioContext.test.ts`
Expected: FAIL — cannot resolve `./audioContext`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/audioContext.ts
import { SAMPLE_RATE } from './consts'

// Constructed lazily on first use, never at module load: jsdom has no
// Web Audio, so touching AudioContext at import time would break every
// test that transitively imports this file.
let context: AudioContext | null = null

export const getAudioContext = () => {
  if (!context) context = new AudioContext({ sampleRate: SAMPLE_RATE })
  return context
}

export const resumeAudioContext = async () => {
  const ctx = getAudioContext()
  if (ctx.state !== 'running') await ctx.resume()
}

// Test-only: drop the singleton so each test starts from a clean context.
export const resetAudioContext = () => {
  context = null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/audioContext.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/audioContext.ts src/lib/audioContext.test.ts
git commit -m "feat: add lazy AudioContext singleton"
```

---

## Task 3: Saturation curve

**Files:**
- Create: `src/lib/saturationCurve.ts`
- Modify: `src/lib/consts.ts`
- Test: `src/lib/saturationCurve.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `getSaturationCurve(saturation: number): Float32Array` (4096 points), and `masterTrim = 0.3` exported from `src/lib/consts.ts`.

**Background for the implementer:** `sineSaturation` (`src/lib/audio.ts:83-102`) works in ±2^15 sample space. With `maxValue = 2 ** 15` it computes `y = sin(clipped * PI / 2 / maxValue) * maxValue`, then blends `y * (mix/100) + dry * (1 - mix/100)`. Rescaled to Web Audio's ±1 domain, `maxValue` cancels and the wet term is simply `sin(x * PI / 2)`. The `mix` and `preGain` mapping is copied verbatim from `getArrangementSamples.ts:41-42`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/saturationCurve.test.ts
import { describe, it, expect } from 'vitest'
import { getSaturationCurve } from './saturationCurve'

const sampleCurve = (curve: Float32Array, x: number) => {
  const index = Math.round(((x + 1) / 2) * (curve.length - 1))
  return curve[index]
}

describe('getSaturationCurve', () => {
  it('is identity at saturation 0', () => {
    const curve = getSaturationCurve(0)
    expect(sampleCurve(curve, 0)).toBeCloseTo(0, 5)
    expect(sampleCurve(curve, 0.5)).toBeCloseTo(0.5, 3)
    expect(sampleCurve(curve, -1)).toBeCloseTo(-1, 3)
  })

  it('applies pure sine shaping at saturation 50', () => {
    const curve = getSaturationCurve(50)
    expect(sampleCurve(curve, 0.5)).toBeCloseTo(Math.sin(0.5 * (Math.PI / 2)), 3)
  })

  it('leaves the endpoints at full scale', () => {
    const curve = getSaturationCurve(50)
    expect(curve[0]).toBeCloseTo(-1, 3)
    expect(curve[curve.length - 1]).toBeCloseTo(1, 3)
  })

  it('is monotonically non-decreasing at every saturation setting', () => {
    for (const saturation of [0, 25, 50, 75, 100]) {
      const curve = getSaturationCurve(saturation)
      for (let i = 1; i < curve.length; i++) {
        expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1] - 1e-6)
      }
    }
  })

  it('returns a 4096 point curve', () => {
    expect(getSaturationCurve(50).length).toBe(4096)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/saturationCurve.test.ts`
Expected: FAIL — cannot resolve `./saturationCurve`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/saturationCurve.ts
const CURVE_POINTS = 4096

/**
 * WaveShaperNode curve for the master saturation stage.
 *
 * Ported from sineSaturation() in ./audio.ts, which works in +/-2^15 sample
 * space. Rescaled to Web Audio's +/-1 domain the maxValue factor cancels and
 * the wet term reduces to sin(x * PI / 2). The mix and preGain mapping is the
 * same one getArrangementSamples used.
 */
export const getSaturationCurve = (saturation: number) => {
  const mix = Math.min(saturation * 2, 100) / 100
  const preGainDb = saturation < 50 ? 0 : ((saturation - 50) / 50) * 12
  const linearGain = Math.pow(10, preGainDb / 20)

  const curve = new Float32Array(CURVE_POINTS)
  for (let i = 0; i < CURVE_POINTS; i++) {
    const x = (i / (CURVE_POINTS - 1)) * 2 - 1
    const driven = Math.max(-1, Math.min(1, x * linearGain))
    const wet = Math.sin(driven * (Math.PI / 2))
    curve[i] = wet * mix + x * (1 - mix)
  }
  return curve
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/saturationCurve.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the master trim constant**

Append to `src/lib/consts.ts`:

```ts
// Fixed headroom before the destination. The master chain has no limiter
// (by design), so this keeps ordinary arrangements clear of the +/-1 ceiling
// where the WaveShaperNode would hard-clip them.
export const masterTrim = 0.3
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/saturationCurve.ts src/lib/saturationCurve.test.ts src/lib/consts.ts
git commit -m "feat: add master saturation curve for WaveShaperNode"
```

---

## Task 4: Slice AudioBuffer cache

**Files:**
- Create: `src/lib/audioBuffers.ts`
- Test: `src/lib/audioBuffers.test.ts`

**Interfaces:**
- Consumes: `getSliceSamples` (`src/helpers/getSliceSamples.ts`, unchanged).
- Produces: `getSliceBuffer(p: { ctx: BaseAudioContext; loadedFile: LoadedFile; sliceIndex: number; fillGaps: boolean }): AudioBuffer` and `clearSliceBufferCache(): void`.

**Background:** the cache key **must** include `slice.start` and the next slice's `start`, mirroring `getPitchAdjustedSliceSamples.ts:24-28`. Slice boundaries are edited at runtime by `updateSliceStart`, `addSlice` and `autoSlice`; a key without them serves stale audio forever. Pitch, volume, note length and saturation are deliberately **not** in the key — removing them from it is the point of this design.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/audioBuffers.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getSliceBuffer, clearSliceBufferCache } from './audioBuffers'
import { createFakeAudioContext } from '../test/audio-mock'
import type { LoadedFile } from './types'

const makeFile = (sliceStarts: number[]): LoadedFile => ({
  name: 'Test Break',
  artist: 'Test',
  year: 1969,
  samples: [
    Float32Array.from({ length: 8 }, (_, i) => (i + 1) * 1000),
    Float32Array.from({ length: 8 }, (_, i) => (i + 1) * 1000),
  ],
  slices: sliceStarts.map(start => ({ start, type: 'Kick' as const, stepNum: 0 })),
  whosampledLink: '',
  whosampledCount: 0,
})

describe('getSliceBuffer', () => {
  beforeEach(() => clearSliceBufferCache())

  it('scales 16-bit sample values into the -1..1 range', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const buffer = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    expect(buffer.length).toBe(4)
    expect(buffer.getChannelData(0)[0]).toBeCloseTo(1000 / 2 ** 15, 6)
  })

  it('doubles the length and mirrors the tail when fillGaps is on', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const buffer = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: true })
    expect(buffer.length).toBe(8)
    const data = buffer.getChannelData(0)
    expect(data[4]).toBeCloseTo(data[3], 6)
    expect(data[7]).toBeCloseTo(data[0], 6)
  })

  it('returns the identical buffer for a repeated call', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const first = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    const second = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    expect(second).toBe(first)
  })

  it('does not serve a stale buffer after a slice boundary moves', () => {
    const ctx = createFakeAudioContext() as unknown as BaseAudioContext
    const file = makeFile([0, 4])
    const before = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    file.slices[1].start = 6
    const after = getSliceBuffer({ ctx, loadedFile: file, sliceIndex: 0, fillGaps: false })
    expect(after).not.toBe(before)
    expect(after.length).toBe(6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/audioBuffers.test.ts`
Expected: FAIL — cannot resolve `./audioBuffers`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/audioBuffers.ts
import { getSliceSamples } from '../helpers/getSliceSamples'
import { SAMPLE_RATE } from './consts'
import type { LoadedFile } from './types'

const SAMPLE_SCALE = 2 ** 15

const cache: { [key: string]: AudioBuffer } = {}

export const clearSliceBufferCache = () => {
  for (const key of Object.keys(cache)) delete cache[key]
}

export const getSliceBuffer = (p: {
  ctx: BaseAudioContext
  loadedFile: LoadedFile
  sliceIndex: number
  fillGaps: boolean
}) => {
  const slice = p.loadedFile.slices[p.sliceIndex]
  const nextSlice = p.loadedFile.slices[p.sliceIndex + 1]

  // Slice boundaries are editable at runtime (updateSliceStart, addSlice,
  // autoSlice), so they have to be part of the key or we serve stale audio.
  const key = [p.loadedFile.name, p.sliceIndex, slice.start, nextSlice?.start, p.fillGaps].join('|')
  if (cache[key]) return cache[key]

  const [left, right] = getSliceSamples(p.loadedFile, p.sliceIndex)
  const frames = p.fillGaps ? left.length * 2 : left.length
  const buffer = p.ctx.createBuffer(2, frames, SAMPLE_RATE)

  for (const [channel, samples] of [left, right].entries()) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < samples.length; i++) data[i] = samples[i] / SAMPLE_SCALE
    // Fill Gaps: append the slice reversed so a pitched-up (shortened) slice
    // runs seamlessly into the next step instead of leaving silence.
    if (p.fillGaps) {
      for (let i = 0; i < samples.length; i++) {
        data[samples.length + i] = samples[samples.length - 1 - i] / SAMPLE_SCALE
      }
    }
  }

  cache[key] = buffer
  return buffer
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/audioBuffers.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/audioBuffers.ts src/lib/audioBuffers.test.ts
git commit -m "feat: add slice AudioBuffer cache keyed on slice boundaries"
```

---

## Task 5: Step duration in seconds

**Files:**
- Create: `src/helpers/getStepSeconds.ts`
- Test: `src/helpers/getStepSeconds.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `getStepSeconds(bpm: number): number`.

**Why a new helper:** `getStepSize` returns samples and stays as-is for the offline buffer length. The scheduler works in seconds, and deriving seconds by dividing by `SAMPLE_RATE` at each call site invites drift between the two.

- [ ] **Step 1: Write the failing test**

```ts
// src/helpers/getStepSeconds.test.ts
import { describe, it, expect } from 'vitest'
import { getStepSeconds } from './getStepSeconds'
import { getStepSize } from './getStepSize'
import { SAMPLE_RATE } from '../lib/consts'

describe('getStepSeconds', () => {
  it('returns a 16th note in seconds at 120 BPM', () => {
    expect(getStepSeconds(120)).toBeCloseTo(0.125, 10)
  })

  it('agrees with getStepSize converted to seconds', () => {
    for (const bpm of [80, 120, 160, 180]) {
      expect(getStepSeconds(bpm)).toBeCloseTo(getStepSize(bpm) / SAMPLE_RATE, 10)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/helpers/getStepSeconds.test.ts`
Expected: FAIL — cannot resolve `./getStepSeconds`.

- [ ] **Step 3: Write the implementation**

```ts
// src/helpers/getStepSeconds.ts
/**
 * Duration of one 16th-note step in seconds.
 * The seconds-domain sibling of getStepSize, which returns samples.
 */
export const getStepSeconds = (bpm: number): number => {
  return 60 / bpm / 4
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/helpers/getStepSeconds.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/helpers/getStepSeconds.ts src/helpers/getStepSeconds.test.ts
git commit -m "feat: add getStepSeconds helper"
```

---

## Task 6: getScheduledNotes — core planning

**Files:**
- Create: `src/helpers/getScheduledNotes.ts`
- Test: `src/helpers/getScheduledNotes.test.ts`

**Interfaces:**
- Consumes: `getStepSeconds` (Task 5), `getSliceIndexFromStepNum` (existing).
- Produces:

```ts
export type ScheduledNote = {
  filename: string   // which break: selects the AudioBuffer
  layerKey: string   // which layer: selects the GainNode ("<filename>#<index>")
  sliceIndex: number
  timeInSeconds: number
  playbackRate: number
  fadeStartSeconds: number | null
  fadeEndSeconds: number | null
}

export const getScheduledNotes: (p: {
  fromStep: number   // inclusive
  toStep: number     // exclusive
  bpm: number
  swing: number
  layers: Layer[]
  loadedFiles: LoadedFile[]
  arrangement: Note[]
  noteLength: number
  noteFadeOut: number
  shortenNotes: boolean
}) => ScheduledNote[]
```

**Notes for the implementer:**
- `timeInSeconds` is relative to step 0 of the pass.
- There is deliberately **no** `gain` field. Layer volume lives on the layer `GainNode` (Task 7) so it can affect already-sounding notes, and so live and offline apply it identically.
- `filename` and `layerKey` are **different things** and both are needed. `addToArrangement` can add the same break twice, giving two layers with the same filename but different volume and pitch. `filename` picks the audio buffer; `layerKey` (`` `${filename}#${layerIndex}` ``) picks the gain node, so two layers of the same break keep independent volumes.
- The bar range is **half-open**. `getArrangementLayerSamples.ts:50` uses `>` where it should use `>=`, which lets a note at `startStep === (bar + 1) * 16` leak into a single-bar render. That is harmless today (the typed array drops the write) but not once notes are real scheduled sources.
- `playbackRate = 2 ** (pitch / 12)`. This reproduces today's direction: `getPitchAdjustedSliceSamples.ts:34-38` resamples to `44100 / 2 ** (pitch/12)` and plays back at 44100, a net speed ratio of `2 ** (pitch/12)`.
- Swing delays **odd** steps by `(swing / 100) * stepSeconds`, matching `getArrangementLayerSamples.ts:31-34`.

- [ ] **Step 1: Write the failing test**

```ts
// src/helpers/getScheduledNotes.test.ts
import { describe, it, expect } from 'vitest'
import { getScheduledNotes } from './getScheduledNotes'
import type { Layer, LoadedFile, Note } from '../lib/types'

const file: LoadedFile = {
  name: 'Break',
  artist: 'Test',
  year: 1969,
  samples: [new Float32Array(1024), new Float32Array(1024)],
  slices: [
    { start: 0, type: 'Kick', stepNum: 0 },
    { start: 256, type: 'Snare', stepNum: 1 },
    { start: 512, type: 'Hat', stepNum: 2 },
  ],
  whosampledLink: '',
  whosampledCount: 0,
}

const layer: Layer = { filename: 'Break', volume: 100, pitch: 0 }

const notes: Note[] = [
  { stepNumToPlay: 0, startStep: 0 },
  { stepNumToPlay: 1, startStep: 1 },
  { stepNumToPlay: 2, startStep: 2 },
]

const base = {
  fromStep: 0,
  toStep: 16,
  bpm: 120,
  swing: 0,
  layers: [layer],
  loadedFiles: [file],
  arrangement: notes,
  noteLength: 200,
  noteFadeOut: 10,
  shortenNotes: false,
}

describe('getScheduledNotes', () => {
  it('places notes on the step grid', () => {
    const result = getScheduledNotes(base)
    expect(result).toHaveLength(3)
    expect(result[0].timeInSeconds).toBeCloseTo(0, 10)
    expect(result[1].timeInSeconds).toBeCloseTo(0.125, 10)
    expect(result[2].timeInSeconds).toBeCloseTo(0.25, 10)
  })

  it('only returns notes in the half-open step range', () => {
    const result = getScheduledNotes({ ...base, fromStep: 1, toStep: 2 })
    expect(result).toHaveLength(1)
    expect(result[0].sliceIndex).toBe(1)
  })

  it('excludes a note exactly on the exclusive upper bound', () => {
    const result = getScheduledNotes({ ...base, fromStep: 0, toStep: 2 })
    expect(result.map(n => n.sliceIndex)).toEqual([0, 1])
  })

  it('delays odd steps by the swing amount', () => {
    const result = getScheduledNotes({ ...base, swing: 50 })
    expect(result[0].timeInSeconds).toBeCloseTo(0, 10)
    expect(result[1].timeInSeconds).toBeCloseTo(0.125 + 0.0625, 10)
    expect(result[2].timeInSeconds).toBeCloseTo(0.25, 10)
  })

  it('converts layer pitch to a playback rate', () => {
    const up = getScheduledNotes({ ...base, layers: [{ ...layer, pitch: 12 }] })
    const down = getScheduledNotes({ ...base, layers: [{ ...layer, pitch: -12 }] })
    expect(up[0].playbackRate).toBeCloseTo(2, 10)
    expect(down[0].playbackRate).toBeCloseTo(0.5, 10)
  })

  it('emits one note per layer', () => {
    const second: Layer = { filename: 'Break', volume: 50, pitch: 7 }
    const result = getScheduledNotes({ ...base, layers: [layer, second] })
    expect(result).toHaveLength(6)
  })

  it('gives two layers of the same break distinct layer keys', () => {
    const second: Layer = { filename: 'Break', volume: 50, pitch: 7 }
    const result = getScheduledNotes({ ...base, layers: [layer, second] })
    expect(new Set(result.map(n => n.layerKey))).toEqual(new Set(['Break#0', 'Break#1']))
  })

  it('skips layers whose file is not loaded', () => {
    const missing: Layer = { filename: 'Nope', volume: 100, pitch: 0 }
    expect(getScheduledNotes({ ...base, layers: [missing] })).toHaveLength(0)
  })

  it('skips notes whose stepNumToPlay has no matching slice', () => {
    const result = getScheduledNotes({
      ...base,
      arrangement: [{ stepNumToPlay: 9, startStep: 0 }],
    })
    expect(result).toHaveLength(0)
  })

  it('leaves fade times null when shorten notes is off', () => {
    const result = getScheduledNotes(base)
    expect(result[0].fadeStartSeconds).toBeNull()
    expect(result[0].fadeEndSeconds).toBeNull()
  })

  it('sets fade times relative to the note start when shorten notes is on', () => {
    const result = getScheduledNotes({
      ...base,
      shortenNotes: true,
      noteLength: 100,
      noteFadeOut: 50,
    })
    expect(result[1].fadeStartSeconds).toBeCloseTo(0.125 + 0.1, 10)
    expect(result[1].fadeEndSeconds).toBeCloseTo(0.125 + 0.15, 10)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/helpers/getScheduledNotes.test.ts`
Expected: FAIL — cannot resolve `./getScheduledNotes`.

- [ ] **Step 3: Write the implementation**

```ts
// src/helpers/getScheduledNotes.ts
import type { Layer, LoadedFile, Note } from '../lib/types'
import { getSliceIndexFromStepNum } from './getSliceIndexFromStepNum'
import { getStepSeconds } from './getStepSeconds'

export type ScheduledNote = {
  filename: string   // which break: selects the AudioBuffer
  layerKey: string   // which layer: selects the GainNode ("<filename>#<index>")
  sliceIndex: number
  timeInSeconds: number
  playbackRate: number
  fadeStartSeconds: number | null
  fadeEndSeconds: number | null
}

/**
 * Pure planning core: decides what plays and when, with no audio types.
 *
 * Layer volume is deliberately absent. It lives on the layer GainNode so it
 * can affect notes that are already sounding, and so the live and offline
 * paths apply it identically.
 */
export const getScheduledNotes = (p: {
  fromStep: number
  toStep: number
  bpm: number
  swing: number
  layers: Layer[]
  loadedFiles: LoadedFile[]
  arrangement: Note[]
  noteLength: number
  noteFadeOut: number
  shortenNotes: boolean
}): ScheduledNote[] => {
  const stepSeconds = getStepSeconds(p.bpm)
  const swingOffset = (startStep: number) =>
    startStep % 2 === 0 ? 0 : (p.swing / 100) * stepSeconds

  const scheduled: ScheduledNote[] = []

  for (const [layerIndex, layer] of p.layers.entries()) {
    const loadedFile = p.loadedFiles.find(file => file.name === layer.filename)
    if (!loadedFile) continue

    const playbackRate = Math.pow(2, layer.pitch / 12)
    // Two layers can share a filename (the same break added twice at
    // different pitches), so the gain node is keyed by position, not name.
    const layerKey = `${layer.filename}#${layerIndex}`

    for (const note of p.arrangement) {
      // Half-open range: a note on the exclusive bound belongs to the next
      // window, otherwise it would be scheduled twice.
      if (note.startStep < p.fromStep || note.startStep >= p.toStep) continue

      const sliceIndex = getSliceIndexFromStepNum(loadedFile, note.stepNumToPlay)
      if (sliceIndex === null) continue

      const timeInSeconds = note.startStep * stepSeconds + swingOffset(note.startStep)
      const fadeStartSeconds = p.shortenNotes ? timeInSeconds + p.noteLength / 1000 : null
      const fadeEndSeconds =
        fadeStartSeconds === null ? null : fadeStartSeconds + p.noteFadeOut / 1000

      scheduled.push({
        filename: layer.filename,
        layerKey,
        sliceIndex,
        timeInSeconds,
        playbackRate,
        fadeStartSeconds,
        fadeEndSeconds,
      })
    }
  }

  return scheduled.sort((a, b) => a.timeInSeconds - b.timeInSeconds)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/helpers/getScheduledNotes.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/helpers/getScheduledNotes.ts src/helpers/getScheduledNotes.test.ts
git commit -m "feat: add pure getScheduledNotes planning core"
```

---

## Task 7: Audio graph

**Files:**
- Create: `src/lib/graph.ts`
- Test: `src/lib/graph.test.ts`

**Interfaces:**
- Consumes: `getSaturationCurve` (Task 3), `masterTrim` (Task 3).
- Produces:

```ts
export type Graph = {
  layerGain: (layerKey: string) => GainNode
  setLayerVolume: (layerKey: string, volume: number) => void
  pruneLayers: (layerKeys: string[]) => void
  setSaturation: (saturation: number) => void
  rampTrimTo: (value: number, seconds: number) => void
  disconnect: () => void
}

export const buildGraph: (ctx: BaseAudioContext) => Graph
```

**Notes for the implementer:**
- Layer gains are keyed by `layerKey` (`` `${filename}#${layerIndex}` ``, produced by `getScheduledNotes` in Task 6), never by filename alone: the same break can appear as two layers with different volumes.
- Volume and trim use `setTargetAtTime` with a 15 ms time constant, not direct assignment, so dragging a slider does not produce zipper noise.
- `setSaturation` rebuilds the curve only when the value actually changed; a curve swap can click, and it should not happen on every tick.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/graph.test.ts
import { describe, it, expect } from 'vitest'
import { buildGraph } from './graph'
import { createFakeAudioContext } from '../test/audio-mock'
import { masterTrim } from './consts'

describe('buildGraph', () => {
  it('sets the trim gain to the configured headroom', () => {
    const ctx = createFakeAudioContext()
    buildGraph(ctx as unknown as BaseAudioContext)
    expect(ctx.createdGains[0].gain.value).toBeCloseTo(masterTrim, 6)
  })

  it('returns the same gain node for a repeated filename', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    expect(graph.layerGain('Amen#0')).toBe(graph.layerGain('Amen#0'))
  })

  it('creates separate gain nodes per layer filename', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    expect(graph.layerGain('Amen#0')).not.toBe(graph.layerGain('Think#1'))
  })

  it('keeps two layers of the same break independent', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    expect(graph.layerGain('Amen#0')).not.toBe(graph.layerGain('Amen#1'))
  })

  it('ramps layer volume rather than assigning it', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    graph.setLayerVolume('Amen#0', 50)
    const gain = graph.layerGain('Amen#0') as unknown as { gain: { calls: unknown[]; value: number } }
    expect(gain.gain.calls).toHaveLength(1)
    expect(gain.gain.value).toBeCloseTo(0.5, 6)
  })

  it('drops gain nodes for layers that no longer exist', () => {
    const ctx = createFakeAudioContext()
    const graph = buildGraph(ctx as unknown as BaseAudioContext)
    const first = graph.layerGain('Amen#0')
    graph.pruneLayers(['Think#0'])
    expect(graph.layerGain('Amen#0')).not.toBe(first)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/graph.test.ts`
Expected: FAIL — cannot resolve `./graph`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/graph.ts
import { masterTrim } from './consts'
import { getSaturationCurve } from './saturationCurve'

const RAMP_TIME_CONSTANT = 0.015

export type Graph = {
  layerGain: (layerKey: string) => GainNode
  setLayerVolume: (layerKey: string, volume: number) => void
  pruneLayers: (layerKeys: string[]) => void
  setSaturation: (saturation: number) => void
  rampTrimTo: (value: number, seconds: number) => void
  disconnect: () => void
}

/**
 * layer gains -> saturation shaper -> trim -> destination
 *
 * Built against any BaseAudioContext so the live and offline paths share it,
 * which is what keeps playback and export in agreement.
 */
export const buildGraph = (ctx: BaseAudioContext): Graph => {
  const trim = ctx.createGain()
  trim.gain.value = masterTrim
  trim.connect(ctx.destination)

  const shaper = ctx.createWaveShaper()
  shaper.oversample = '4x'
  shaper.connect(trim)

  const gains: { [layerKey: string]: GainNode } = {}
  let saturation: number | null = null

  const layerGain = (layerKey: string) => {
    if (!gains[layerKey]) {
      const gain = ctx.createGain()
      gain.connect(shaper)
      gains[layerKey] = gain
    }
    return gains[layerKey]
  }

  return {
    layerGain,
    setLayerVolume: (layerKey, volume) => {
      // setTargetAtTime rather than a direct assignment: a slider drag would
      // otherwise step the gain and produce zipper noise.
      layerGain(layerKey).gain.setTargetAtTime(
        volume / 100,
        ctx.currentTime,
        RAMP_TIME_CONSTANT
      )
    },
    pruneLayers: layerKeys => {
      for (const layerKey of Object.keys(gains)) {
        if (layerKeys.includes(layerKey)) continue
        gains[layerKey].disconnect()
        delete gains[layerKey]
      }
    },
    setSaturation: value => {
      // Only rebuild on a real change: swapping a curve can click, and doing
      // it on every tick would click constantly.
      if (value === saturation) return
      saturation = value
      shaper.curve = getSaturationCurve(value)
    },
    rampTrimTo: (value, seconds) => {
      trim.gain.cancelScheduledValues(ctx.currentTime)
      trim.gain.setValueAtTime(trim.gain.value, ctx.currentTime)
      trim.gain.linearRampToValueAtTime(value, ctx.currentTime + seconds)
    },
    disconnect: () => {
      for (const layerKey of Object.keys(gains)) {
        gains[layerKey].disconnect()
        delete gains[layerKey]
      }
      shaper.disconnect()
      trim.disconnect()
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/graph.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/graph.ts src/lib/graph.test.ts
git commit -m "feat: add Web Audio graph builder shared by live and offline paths"
```

---

## Task 8: Note firing

**Files:**
- Create: `src/lib/fireNote.ts`
- Test: `src/lib/fireNote.test.ts`

**Interfaces:**
- Consumes: `ScheduledNote` (Task 6), `Graph` (Task 7), `getSliceBuffer` (Task 4).
- Produces: `fireNote(p: { ctx: BaseAudioContext; graph: Graph; note: ScheduledNote; loadedFile: LoadedFile; fillGaps: boolean; passStartTime: number }): void`.

**Why its own module:** both the scheduler (Task 9) and the offline renderer (Task 14) fire notes, and neither should own the logic.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/fireNote.test.ts
import { describe, it, expect } from 'vitest'
import { fireNote } from './fireNote'
import { buildGraph } from './graph'
import { clearSliceBufferCache } from './audioBuffers'
import { createFakeAudioContext } from '../test/audio-mock'
import type { ScheduledNote } from '../helpers/getScheduledNotes'
import type { LoadedFile } from './types'

const loadedFile: LoadedFile = {
  name: 'Break',
  artist: 'Test',
  year: 1969,
  samples: [new Float32Array(1024), new Float32Array(1024)],
  slices: [
    { start: 0, type: 'Kick', stepNum: 0 },
    { start: 512, type: 'Snare', stepNum: 1 },
  ],
  whosampledLink: '',
  whosampledCount: 0,
}

const note: ScheduledNote = {
  filename: 'Break',
  layerKey: 'Break#0',
  sliceIndex: 0,
  timeInSeconds: 0.25,
  playbackRate: 1.5,
  fadeStartSeconds: null,
  fadeEndSeconds: null,
}

const fire = (overrides: Partial<ScheduledNote>) => {
  clearSliceBufferCache()
  const ctx = createFakeAudioContext()
  const graph = buildGraph(ctx as unknown as BaseAudioContext)
  fireNote({
    ctx: ctx as unknown as BaseAudioContext,
    graph,
    note: { ...note, ...overrides },
    loadedFile,
    fillGaps: false,
    passStartTime: 10,
  })
  return ctx
}

describe('fireNote', () => {
  it('starts the source at the pass start plus the note offset', () => {
    const ctx = fire({})
    expect(ctx.createdSources[0].startedAt).toBeCloseTo(10.25, 10)
  })

  it('applies the playback rate', () => {
    const ctx = fire({})
    expect(ctx.createdSources[0].playbackRate.value).toBeCloseTo(1.5, 10)
  })

  it('schedules no envelope when fade times are null', () => {
    const ctx = fire({})
    const noteGain = ctx.createdGains[ctx.createdGains.length - 1]
    expect(noteGain.gain.calls).toHaveLength(0)
    expect(ctx.createdSources[0].stoppedAt).toBeNull()
  })

  it('ramps down and stops the source when fade times are set', () => {
    const ctx = fire({ fadeStartSeconds: 0.35, fadeEndSeconds: 0.4 })
    const noteGain = ctx.createdGains[ctx.createdGains.length - 1]
    expect(noteGain.gain.calls).toEqual([
      { method: 'setValueAtTime', value: 1, time: 10.35 },
      { method: 'linearRampToValueAtTime', value: 0, time: 10.4 },
    ])
    expect(ctx.createdSources[0].stoppedAt).toBeCloseTo(10.4, 10)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/fireNote.test.ts`
Expected: FAIL — cannot resolve `./fireNote`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/fireNote.ts
import type { ScheduledNote } from '../helpers/getScheduledNotes'
import { getSliceBuffer } from './audioBuffers'
import type { Graph } from './graph'
import type { LoadedFile } from './types'

/**
 * Turn one ScheduledNote into live nodes:
 *   source (playbackRate) -> note gain (shorten-notes ramp) -> layer gain
 */
export const fireNote = (p: {
  ctx: BaseAudioContext
  graph: Graph
  note: ScheduledNote
  loadedFile: LoadedFile
  fillGaps: boolean
  passStartTime: number
}) => {
  const buffer = getSliceBuffer({
    ctx: p.ctx,
    loadedFile: p.loadedFile,
    sliceIndex: p.note.sliceIndex,
    fillGaps: p.fillGaps,
  })

  const when = p.passStartTime + p.note.timeInSeconds

  // Resolve the layer gain first so the note gain is the last node created:
  // the tests identify it that way, and creating them the other way round
  // makes the layer gain the last one instead.
  const layerGain = p.graph.layerGain(p.note.layerKey)

  const noteGain = p.ctx.createGain()
  noteGain.connect(layerGain)

  const source = p.ctx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = p.note.playbackRate
  source.connect(noteGain)

  source.start(when)

  if (p.note.fadeStartSeconds !== null && p.note.fadeEndSeconds !== null) {
    noteGain.gain.setValueAtTime(1, p.passStartTime + p.note.fadeStartSeconds)
    noteGain.gain.linearRampToValueAtTime(0, p.passStartTime + p.note.fadeEndSeconds)
    source.stop(p.passStartTime + p.note.fadeEndSeconds)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/fireNote.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/fireNote.ts src/lib/fireNote.test.ts
git commit -m "feat: add fireNote for turning a ScheduledNote into live nodes"
```

---

## Task 9: Scheduler

**Files:**
- Create: `src/lib/scheduler.ts`
- Test: `src/lib/scheduler.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–8, plus store atoms.
- Produces: `startScheduler(ctx?: BaseAudioContext): void`, `stopScheduler(): Promise<void>`, `tick(): void` (exported for tests), `getLoopPosition(): { bar: number; step: number; fraction: number } | null`, `isSchedulerRunning(): boolean`.

**The two clocks — read this before implementing.** The lookahead deliberately crosses the loop boundary, so the *scheduling* cursor points at the next pass while the current pass is still being heard. A playhead derived from the scheduling cursor would go negative once per pass and jump backwards on screen. The scheduler therefore keeps:

- `schedulingPassStart` — context time of step 0 of the pass **being scheduled**.
- `passes: { startTime: number; duration: number }[]` — every pass scheduled so far. `getLoopPosition()` finds the pass containing the *audible* time and prunes passes that have finished.

Audible time is `ctx.currentTime - (ctx.baseLatency + ctx.outputLatency)`, because `currentTime` leads what the speakers are playing.

The **Class B snapshot** (`bpm`, `swing`, `numBars`) is taken when step 0 of a pass is *scheduled*. This is why a BPM change made in the last ~100 ms of a pass takes effect one pass later — by then the next pass has already been scheduled.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/scheduler.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { startScheduler, stopScheduler, tick, getLoopPosition } from './scheduler'
import { createFakeAudioContext } from '../test/audio-mock'
import { clearSliceBufferCache } from './audioBuffers'
import {
  Arrangement,
  BPM,
  FillGaps,
  Layers,
  LoadedFiles,
  NoteFadeOut,
  NoteLength,
  NumBars,
  Saturation,
  ShortenNotes,
  Swing,
} from './store'
import type { LoadedFile } from './types'

const loadedFile: LoadedFile = {
  name: 'Break',
  artist: 'Test',
  year: 1969,
  samples: [new Float32Array(4096), new Float32Array(4096)],
  slices: Array.from({ length: 16 }, (_, i) => ({
    start: i * 256,
    type: 'Kick' as const,
    stepNum: i,
  })),
  whosampledLink: '',
  whosampledCount: 0,
}

let ctx: ReturnType<typeof createFakeAudioContext>

beforeEach(async () => {
  await stopScheduler()
  clearSliceBufferCache()
  ctx = createFakeAudioContext()
  LoadedFiles.set([loadedFile])
  Layers.set([{ filename: 'Break', volume: 100, pitch: 0 }])
  Arrangement.set(Array.from({ length: 16 }, (_, i) => ({ stepNumToPlay: i, startStep: i })))
  BPM.set(120)
  Swing.set(0)
  NumBars.set(1)
  NoteLength.set(200)
  NoteFadeOut.set(10)
  Saturation.set(0)
  FillGaps.set(false)
  ShortenNotes.set(false)
})

describe('scheduler', () => {
  it('schedules only the notes inside the lookahead window', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    // At 120 BPM a step is 0.125 s, so a 0.1 s window covers step 0 only.
    expect(ctx.createdSources).toHaveLength(1)
  })

  it('schedules further notes as time advances', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    ctx.advance(0.125)
    tick()
    expect(ctx.createdSources.length).toBeGreaterThan(1)
  })

  it('does not schedule the same step twice', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    const before = ctx.createdSources.length
    tick()
    tick()
    expect(ctx.createdSources).toHaveLength(before)
  })

  it('picks up a grid edit without restarting', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    Arrangement.set([{ stepNumToPlay: 4, startStep: 8 }])
    // 0.95 s, not 0.9: the note sits at step 8 = 1.0 s and the lookahead
    // condition is strictly < horizon, so 0.9 would exclude it.
    ctx.advance(0.95)
    tick()
    const lastSource = ctx.createdSources[ctx.createdSources.length - 1]
    expect(lastSource.startedAt).toBeCloseTo(8 * 0.125, 6)
  })

  it('keeps the old tempo for the remainder of the pass after a BPM change', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    BPM.set(60)
    ctx.advance(0.125)
    tick()
    // Still the 120 BPM grid: step 1 sits at 0.125 s, not 0.25 s.
    expect(ctx.createdSources[1].startedAt).toBeCloseTo(0.125, 6)
  })

  it('applies the new tempo from the next pass', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    BPM.set(60)
    // Run out the 2 s pass so the next one is snapshotted at 60 BPM.
    for (let i = 0; i < 20; i++) {
      ctx.advance(0.125)
      tick()
    }
    const passTwoStart = ctx.createdSources.find(s => (s.startedAt ?? 0) >= 2)
    expect(passTwoStart?.startedAt).toBeCloseTo(2, 6)
  })

  it('schedules nothing while there are no layers', () => {
    Layers.set([])
    startScheduler(ctx as unknown as BaseAudioContext)
    expect(ctx.createdSources).toHaveLength(0)
  })

  it('never reports a negative loop position, including across the boundary', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    for (let i = 0; i < 40; i++) {
      ctx.advance(0.05)
      tick()
      const position = getLoopPosition()
      expect(position).not.toBeNull()
      expect(position!.fraction).toBeGreaterThanOrEqual(0)
      expect(position!.fraction).toBeLessThan(1)
    }
  })

  it('advances the loop position monotonically within a pass', () => {
    startScheduler(ctx as unknown as BaseAudioContext)
    const first = getLoopPosition()!.fraction
    ctx.advance(0.5)
    tick()
    expect(getLoopPosition()!.fraction).toBeGreaterThan(first)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/scheduler.test.ts`
Expected: FAIL — cannot resolve `./scheduler`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/scheduler.ts
import { getScheduledNotes } from '../helpers/getScheduledNotes'
import { getStepSeconds } from '../helpers/getStepSeconds'
import { getAudioContext } from './audioContext'
import { fireNote } from './fireNote'
import { buildGraph } from './graph'
import type { Graph } from './graph'
import {
  Arrangement,
  BPM,
  FillGaps,
  Layers,
  LoadedFiles,
  NoteFadeOut,
  NoteLength,
  NumBars,
  Saturation,
  ShortenNotes,
  Swing,
} from './store'

const TICK_MS = 25
const LOOKAHEAD_SECONDS = 0.1
const STOP_RAMP_SECONDS = 0.02

type Snapshot = { bpm: number; swing: number; numBars: number }
type Pass = { startTime: number; duration: number; steps: number }

let ctx: BaseAudioContext | null = null
let graph: Graph | null = null
let intervalId: ReturnType<typeof setInterval> | null = null

// Scheduling cursor: step 0 of the pass being SCHEDULED, which runs ahead of
// what is audible. Never use it for the playhead.
let schedulingPassStart = 0
let nextStepIndex = 0
let snapshot: Snapshot = { bpm: 120, swing: 0, numBars: 1 }

// Passes actually scheduled, oldest first. getLoopPosition reads these so the
// playhead follows what is audible rather than what has been scheduled.
let passes: Pass[] = []

const readSnapshot = (): Snapshot => ({
  bpm: BPM.ref(),
  swing: Swing.ref(),
  numBars: NumBars.ref(),
})

const passDuration = (s: Snapshot) => s.numBars * 16 * getStepSeconds(s.bpm)

const audibleTime = () => {
  if (!ctx) return 0
  const latency =
    ((ctx as AudioContext).baseLatency ?? 0) + ((ctx as AudioContext).outputLatency ?? 0)
  return ctx.currentTime - latency
}

const scheduleStep = (stepIndex: number) => {
  const layers = Layers.ref()
  if (!layers.length) return

  const loadedFiles = LoadedFiles.ref()
  const fillGaps = FillGaps.ref()

  const notes = getScheduledNotes({
    fromStep: stepIndex,
    toStep: stepIndex + 1,
    bpm: snapshot.bpm,
    swing: snapshot.swing,
    layers,
    loadedFiles,
    arrangement: Arrangement.ref(),
    noteLength: NoteLength.ref(),
    noteFadeOut: NoteFadeOut.ref(),
    shortenNotes: ShortenNotes.ref(),
  })

  for (const note of notes) {
    const loadedFile = loadedFiles.find(file => file.name === note.filename)
    if (!loadedFile || !ctx || !graph) continue
    fireNote({ ctx, graph, note, loadedFile, fillGaps, passStartTime: schedulingPassStart })
  }
}

export const tick = () => {
  if (!ctx || !graph) return

  // Node-level Class A parameters: these live on persistent nodes, so they
  // also affect notes that are already sounding.
  graph.setSaturation(Saturation.ref())
  const layers = Layers.ref()
  const layerKeys = layers.map((layer, index) => `${layer.filename}#${index}`)
  graph.pruneLayers(layerKeys)
  for (const [index, layer] of layers.entries()) {
    graph.setLayerVolume(layerKeys[index], layer.volume)
  }

  const horizon = ctx.currentTime + LOOKAHEAD_SECONDS
  const stepsPerPass = snapshot.numBars * 16

  while (schedulingPassStart + nextStepIndex * getStepSeconds(snapshot.bpm) < horizon) {
    scheduleStep(nextStepIndex)
    nextStepIndex++

    if (nextStepIndex >= stepsPerPass) {
      schedulingPassStart += passDuration(snapshot)
      nextStepIndex = 0
      // Class B applies here, at the moment step 0 of the next pass is
      // scheduled -- which is why a late change lands one pass later.
      snapshot = readSnapshot()
      passes.push({
        startTime: schedulingPassStart,
        duration: passDuration(snapshot),
        steps: snapshot.numBars * 16,
      })
    }
  }
}

export const startScheduler = (context?: BaseAudioContext) => {
  if (intervalId) return

  ctx = context ?? getAudioContext()
  graph = buildGraph(ctx)
  snapshot = readSnapshot()
  schedulingPassStart = ctx.currentTime
  nextStepIndex = 0
  passes = [
    {
      startTime: schedulingPassStart,
      duration: passDuration(snapshot),
      steps: snapshot.numBars * 16,
    },
  ]

  tick()
  intervalId = setInterval(tick, TICK_MS)
}

export const stopScheduler = async () => {
  if (intervalId) clearInterval(intervalId)
  intervalId = null

  if (graph) {
    // No per-note handles are kept, so silence everything with a short master
    // ramp and then tear the graph down.
    graph.rampTrimTo(0, STOP_RAMP_SECONDS)
    const dying = graph
    graph = null
    await new Promise(resolve => setTimeout(resolve, STOP_RAMP_SECONDS * 1000))
    dying.disconnect()
  }

  ctx = null
  passes = []
  nextStepIndex = 0
}

export const isSchedulerRunning = () => intervalId !== null

export const getLoopPosition = () => {
  if (!ctx || !passes.length) return null
  const now = audibleTime()

  while (passes.length > 1 && now >= passes[0].startTime + passes[0].duration) passes.shift()

  const pass = passes[0]
  const elapsed = now - pass.startTime
  if (elapsed < 0) return { bar: 0, step: 0, fraction: 0 }

  const fraction = Math.min(elapsed / pass.duration, 0.999999)
  const step = Math.floor(fraction * pass.steps)
  return { bar: Math.floor(step / 16), step: step % 16, fraction }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/scheduler.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scheduler.ts src/lib/scheduler.test.ts
git commit -m "feat: add lookahead scheduler with per-pass Class B snapshot"
```

---

## Task 10: Wire playback to the scheduler

**Files:**
- Modify: `src/actions/playArrangement.ts`, `src/actions/addToArrangement.ts`, `src/actions/randomiseLayers.ts`, `src/lib/playback.ts`, `src/App.tsx`, `src/layout/Arrangement/Main/BottomBar/index.tsx`, `src/hooks/useWindowListeners.ts`
- Delete: `src/actions/restartPlayback.ts`, `src/actions/restartPlayback.test.ts`, `src/hooks/useRestartPlayback.ts`, `src/hooks/useRestartPlayback.test.tsx`
- Test: `src/actions/playArrangement.test.ts` (rewrite), `src/actions/addToArrangement.test.ts` (update)

**Interfaces:**
- Consumes: `startScheduler`, `stopScheduler`, `isSchedulerRunning` (Task 9), `resumeAudioContext` (Task 2).
- Produces: `playArrangement(): Promise<void>`, `stopArrangement(): Promise<void>` in `src/lib/playback.ts`.

**Behaviour being changed, deliberately:** `addToArrangement.ts:18` calls `restartPlayback` (added in commit `5df1894` with tests asserting playback restarts on layer add). That behaviour is superseded, not lost — the new layer is picked up on the next tick with no restart. `randomiseLayers.ts:8` sets `Layers` to `[]` before refilling; that transient empty state must go, because "no layers" now means "stop". Its closing `await playArrangement()` is **kept**: randomising still starts playback if you were not already playing.

- [ ] **Step 1: Rewrite playArrangement and its test**

```ts
// src/actions/playArrangement.ts
import { resumeAudioContext } from '../lib/audioContext'
import { startScheduler } from '../lib/scheduler'
import { Playing } from '../lib/store'

export const playArrangement = async () => {
  await resumeAudioContext()
  Playing.set(true)
  startScheduler()
}
```

```ts
// src/actions/playArrangement.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playArrangement } from './playArrangement'
import { Playing } from '../lib/store'
import { startScheduler } from '../lib/scheduler'
import { resumeAudioContext } from '../lib/audioContext'

vi.mock('../lib/scheduler', () => ({ startScheduler: vi.fn() }))
vi.mock('../lib/audioContext', () => ({ resumeAudioContext: vi.fn().mockResolvedValue(undefined) }))

describe('playArrangement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Playing.set(false)
  })

  it('resumes the audio context before starting', async () => {
    await playArrangement()
    expect(resumeAudioContext).toHaveBeenCalled()
  })

  it('starts the scheduler', async () => {
    await playArrangement()
    expect(startScheduler).toHaveBeenCalled()
  })

  it('marks the arrangement as playing', async () => {
    await playArrangement()
    expect(Playing.ref()).toBe(true)
  })
})
```

- [ ] **Step 2: Split stopPlayback in `src/lib/playback.ts`**

Replace `stopPlayback` with two functions, keeping `calculateDuration`, `setupPlayerStopHandler` and `startPlayback` untouched for now (they still serve the Library previews until Task 17):

```ts
import { stopScheduler } from './scheduler'

/** Stops the arrangement. The Library preview is stopPreview's job. */
export const stopArrangement = async () => {
  await stopScheduler()
  Playing.set(false)
}

/** Stops a one-shot Library preview. */
export const stopPreview = () => {
  Player.ref()?.stop()
  PlayStartTimestamp.set(null)
  PlayDuration.set(null)
}
```

Update the four call sites to whichever they mean: `BottomBar/index.tsx:24` → `stopArrangement`; `useWindowListeners.ts:15` (spacebar) → `stopArrangement`; `TrimEditor.tsx:27` → `stopPreview`; `playTrim.ts:23` → `stopPreview`.

- [ ] **Step 3: Run the affected tests to see them fail**

Run: `npx vitest run src/actions/playArrangement.test.ts src/lib/playback.test.ts`
Expected: FAIL — `playback.test.ts` still references `stopPlayback`.

- [ ] **Step 4: Update `playback.test.ts`**

Replace every `stopPlayback` reference with `stopArrangement` (for the cases asserting `Playing` is cleared) or `stopPreview` (for the cases asserting `PlayStartTimestamp` / `PlayDuration` are cleared). Delete assertions about `Player.ref()?.stop()` in the arrangement cases — the scheduler owns that now.

- [ ] **Step 5: Remove restartPlayback and its consumers**

```bash
git rm src/actions/restartPlayback.ts src/actions/restartPlayback.test.ts
git rm src/hooks/useRestartPlayback.ts src/hooks/useRestartPlayback.test.tsx
```

In `src/actions/addToArrangement.ts`: delete the `restartPlayback` import (line 4) and its call (line 18). In `src/App.tsx`: delete the `useRestartPlayback` import and call.

In `src/actions/addToArrangement.test.ts`: replace the assertion that `restartPlayback` was called with an assertion that the layer was appended and `Tab` was set to `'arrangement'` — the layer is now picked up by the scheduler on its next tick, with no restart.

- [ ] **Step 6: Make randomiseLayers set layers atomically**

In `src/actions/randomiseLayers.ts`, delete `Layers.set([])` (line 8) and the `await new Promise(r => setTimeout(r))` on line 10 that existed to let the empty state flush. Keep the final `Layers.set([...savedLayers])` and the closing `await playArrangement()`. Update `randomiseLayers.test.ts` to drop any assertion that `Layers` is transiently empty.

- [ ] **Step 7: Run the full suite**

Run: `npm run test:run`
Expected: PASS. If `integration.test.ts` fails, update it to drive playback through `playArrangement` / `stopArrangement` rather than through buffer rendering.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: drive arrangement playback from the scheduler, remove restart-on-edit"
```

---

## Task 11: Playhead from the scheduler clock

**Files:**
- Modify: `src/components/Waveform.tsx`, `src/layout/Arrangement/Main/ArragementWaveform/index.tsx`, `src/layout/Arrangement/Main/BarSelection/index.tsx`
- Test: `src/components/Waveform.test.tsx` (extend), `src/layout/Arrangement/Main/BarSelection/index.test.tsx` (update)

**Interfaces:**
- Consumes: `getLoopPosition` (Task 9), `Playing` atom.
- Produces: `Waveform` gains a `useLoopPosition?: boolean` prop selecting arrangement mode.

**Important:** `Waveform` is shared. `LibraryWaveform.tsx` drives one-shot previews on wall-clock timing and **must keep** its existing `playStartTimestamp` / `playDuration` path. Only the arrangement callers opt into the new mode. This is a rewrite of the arrangement animation model, not a swap of time source: today the arrangement playhead drives a WAAPI `playHead.animate(...)` restarted on each bar wrap (`Waveform.tsx:102-108`); arrangement mode instead writes `transform` per frame from `requestAnimationFrame`.

- [ ] **Step 1: Write the failing test**

```tsx
// append to src/components/Waveform.test.tsx
import { getLoopPosition } from '../lib/scheduler'

vi.mock('../lib/scheduler', () => ({ getLoopPosition: vi.fn() }))

describe('Waveform arrangement mode', () => {
  it('positions the playhead from the scheduler loop position', async () => {
    ;(getLoopPosition as ReturnType<typeof vi.fn>).mockReturnValue({
      bar: 0,
      step: 8,
      fraction: 0.5,
    })
    render(
      <Waveform
        samples={new Float32Array(128)}
        width={100}
        height={50}
        offset={0}
        scaleX={1}
        slices={[]}
        playHeadId="test-head"
        useLoopPosition
        isPlaying
        selectedBarIndex={0}
        totalBars={1}
      />
    )
    await waitFor(() => {
      const head = document.getElementById('test-head')!
      expect(head.style.transform).toContain('50')
    })
  })

  it('hides the playhead when not playing', async () => {
    ;(getLoopPosition as ReturnType<typeof vi.fn>).mockReturnValue(null)
    render(
      <Waveform
        samples={new Float32Array(128)}
        width={100}
        height={50}
        offset={0}
        scaleX={1}
        slices={[]}
        playHeadId="test-head-2"
        useLoopPosition
        isPlaying={false}
      />
    )
    await waitFor(() => {
      expect(document.getElementById('test-head-2')!.style.display).toBe('none')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Waveform.test.tsx`
Expected: FAIL — `useLoopPosition` is not a prop.

- [ ] **Step 3: Add arrangement mode to Waveform**

Add `useLoopPosition?: boolean` to the props type, and add this effect alongside the existing ones. Leave the existing library-mode effect untouched.

```tsx
// Arrangement mode: drive the playhead from the scheduler's audible clock
// rather than wall-clock time. The library preview keeps the old path.
useEffect(() => {
  if (!p.useLoopPosition || !p.playHeadId) return

  let frame = 0
  const draw = () => {
    const head = document.getElementById(p.playHeadId!)
    const position = getLoopPosition()

    if (!head) {
      frame = requestAnimationFrame(draw)
      return
    }

    if (!p.isPlaying || !position) {
      head.style.display = 'none'
      frame = requestAnimationFrame(draw)
      return
    }

    const bars = p.totalBars ?? 1
    const bar = p.selectedBarIndex ?? 0
    const barProgress = position.fraction * bars - bar

    if (barProgress < 0 || barProgress >= 1) {
      head.style.display = 'none'
    } else {
      head.style.display = 'block'
      head.style.transform = `translateX(${barProgress * 100}%)`
    }

    frame = requestAnimationFrame(draw)
  }

  frame = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(frame)
}, [p.useLoopPosition, p.playHeadId, p.isPlaying, p.totalBars, p.selectedBarIndex])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Waveform.test.tsx`
Expected: PASS.

- [ ] **Step 5: Switch the two arrangement callers**

In `ArragementWaveform/index.tsx`: drop the `Player` and `PlayStartTimestamp` subscriptions, pass `useLoopPosition` and `isPlaying={Playing.useState()}`, and drop `playStartTimestamp` and `barDuration`.

In `BarSelection/index.tsx`: replace the `useEffect` + `setInterval` that computes `currentPlayingBar` from `Date.now()` with an rAF loop reading `getLoopPosition()?.bar`, and replace `isPlaying` with the `Playing` atom.

- [ ] **Step 6: Run the full suite and commit**

Run: `npm run test:run`
Expected: PASS.

```bash
git add -A
git commit -m "feat: drive arrangement playhead from the scheduler clock"
```

---

## Task 12: Offline render with wrap-around tail fold

**Files:**
- Create: `src/lib/offlineRender.ts`
- Test: `src/lib/offlineRender.test.ts`

**Interfaces:**
- Consumes: `getScheduledNotes`, `buildGraph`, `fireNote`, `getStepSize`.
- Produces: `renderOffline(p?: { bar?: number; layers?: Layer[] }): Promise<AudioBuffer>`, `audioBufferToSamples(buffer: AudioBuffer): [Float32Array, Float32Array]`.

`bar` selects a single bar (used by the waveform, which draws only the selected bar, matching today's `getArrangementSamples({ bar })`). Omitted, it renders the whole arrangement (used by export).

**The tail fold — do not skip this.** Today a note tail running past the end of the arrangement is truncated: `getArrangementLayerSamples.ts:73-74` writes past the buffer end and the typed array drops it. Live, source nodes ring into the next pass and sum with its opening notes. Live wrapping is the behaviour we want, so the offline render must **match it**: render `bars + 1` bars, then fold the extra bar back onto the start before trimming. Without this, export and playback diverge exactly where it is most audible — swung notes on the last step, and any note at all when Shorten Notes is off (the default, `store.ts:42`).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/offlineRender.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { audioBufferToSamples } from './offlineRender'
import { createFakeAudioContext } from '../test/audio-mock'

describe('audioBufferToSamples', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scales -1..1 back to 16-bit range', () => {
    const ctx = createFakeAudioContext()
    const buffer = ctx.createBuffer(2, 4, 44100)
    buffer.getChannelData(0)[0] = 1
    buffer.getChannelData(1)[0] = -1
    const [left, right] = audioBufferToSamples(buffer)
    expect(left[0]).toBeCloseTo(32767, 0)
    expect(right[0]).toBeCloseTo(-32767, 0)
  })

  it('returns both channels at full length', () => {
    const ctx = createFakeAudioContext()
    const [left, right] = audioBufferToSamples(ctx.createBuffer(2, 8, 44100))
    expect(left).toHaveLength(8)
    expect(right).toHaveLength(8)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/offlineRender.test.ts`
Expected: FAIL — cannot resolve `./offlineRender`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/offlineRender.ts
import { getScheduledNotes } from '../helpers/getScheduledNotes'
import { getStepSize } from '../helpers/getStepSize'
import { fireNote } from './fireNote'
import { buildGraph } from './graph'
import { SAMPLE_RATE } from './consts'
import {
  Arrangement,
  BPM,
  FillGaps,
  Layers,
  LoadedFiles,
  NoteFadeOut,
  NoteLength,
  NumBars,
  Saturation,
  ShortenNotes,
  Swing,
} from './store'
import type { Layer } from './types'

const OUT_SCALE = 32767

export const audioBufferToSamples = (buffer: AudioBuffer): [Float32Array, Float32Array] => {
  const left = new Float32Array(buffer.length)
  const right = new Float32Array(buffer.length)
  const sourceLeft = buffer.getChannelData(0)
  const sourceRight = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : sourceLeft
  for (let i = 0; i < buffer.length; i++) {
    left[i] = sourceLeft[i] * OUT_SCALE
    right[i] = sourceRight[i] * OUT_SCALE
  }
  return [left, right]
}

/**
 * Renders the arrangement through an OfflineAudioContext using the same
 * planning output and graph as live playback, so export matches what you hear.
 *
 * One extra bar is rendered and folded back onto the start: live, note tails
 * ring into the next pass, and a plain truncating render would not match.
 */
export const renderOffline = async (p?: { bar?: number; layers?: Layer[] }) => {
  const bars = p?.bar === undefined ? NumBars.ref() : 1
  const firstStep = (p?.bar ?? 0) * 16
  const layers = p?.layers ?? Layers.ref()
  const loadedFiles = LoadedFiles.ref()
  const bpm = BPM.ref()

  const stepSize = getStepSize(bpm)
  // OfflineAudioContext requires an integer length; getStepSize returns a float.
  const length = Math.round(stepSize * 16 * bars)
  const tailLength = Math.round(stepSize * 16)

  const ctx = new OfflineAudioContext(2, length + tailLength, SAMPLE_RATE)
  const graph = buildGraph(ctx)
  graph.setSaturation(Saturation.ref())
  for (const [index, layer] of layers.entries()) {
    graph.setLayerVolume(`${layer.filename}#${index}`, layer.volume)
  }

  const notes = getScheduledNotes({
    fromStep: firstStep,
    toStep: firstStep + bars * 16,
    bpm,
    swing: Swing.ref(),
    layers,
    loadedFiles,
    arrangement: Arrangement.ref(),
    noteLength: NoteLength.ref(),
    noteFadeOut: NoteFadeOut.ref(),
    shortenNotes: ShortenNotes.ref(),
  })

  // getScheduledNotes returns times relative to step 0 of the arrangement, so
  // a single-bar render has to shift them back to the start of the buffer.
  const passStartTime = -firstStep * (stepSize / SAMPLE_RATE)

  const fillGaps = FillGaps.ref()
  for (const note of notes) {
    const loadedFile = loadedFiles.find(file => file.name === note.filename)
    if (!loadedFile) continue
    fireNote({ ctx, graph, note, loadedFile, fillGaps, passStartTime })
  }

  const rendered = await ctx.startRendering()

  const folded = ctx.createBuffer(2, length, SAMPLE_RATE)
  for (let channel = 0; channel < 2; channel++) {
    const source = rendered.getChannelData(channel)
    const target = folded.getChannelData(channel)
    for (let i = 0; i < length; i++) target[i] = source[i]
    // Fold the tail back onto the start, matching how live playback wraps.
    for (let i = 0; i < tailLength && i < length; i++) target[i] += source[length + i]
  }

  return folded
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/offlineRender.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/offlineRender.ts src/lib/offlineRender.test.ts
git commit -m "feat: add offline render with wrap-around tail fold"
```

---

## Task 13: Real OfflineAudioContext golden test

**Files:**
- Create: `src/lib/offlineRender.browser.test.ts`
- Modify: `vite.config.ts`
- Test: itself

**Why this task exists:** Tasks 12 and 14 swap the entire render engine and change output levels, and every other test mocks the context. A clipping regression or a broken tail fold would land unnoticed. This is the cheap insurance: one real render, asserting peak level and that the fold actually happened.

- [ ] **Step 1: Add a separate browser test config**

This repo is on vitest 2.1 (`package.json`), which has no `test.projects` — that
is vitest 3. Use a second config file instead, and exclude the browser test from
the default jsdom run.

Create `vitest.browser.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import type { UserConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['src/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
  },
} as UserConfig)
```

In `vite.config.ts`, add to the `test` block so the jsdom run skips it:

```ts
    exclude: ['**/node_modules/**', '**/*.browser.test.ts'],
```

Add to `package.json` scripts:

```json
    "test:browser": "vitest run --config vitest.browser.config.ts"
```

Install the provider: `npm i -D @vitest/browser playwright`, then
`npx playwright install chromium`.

- [ ] **Step 2: Write the test**

```ts
// src/lib/offlineRender.browser.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderOffline } from './offlineRender'
import { clearSliceBufferCache } from './audioBuffers'
import { Arrangement, BPM, FillGaps, Layers, LoadedFiles, NumBars, Saturation, ShortenNotes, Swing } from './store'
import type { LoadedFile } from './types'

const loudFile: LoadedFile = {
  name: 'Loud',
  artist: 'Test',
  year: 1969,
  samples: [
    Float32Array.from({ length: 44100 }, () => 32000),
    Float32Array.from({ length: 44100 }, () => 32000),
  ],
  slices: [{ start: 0, type: 'Kick', stepNum: 0 }],
  whosampledLink: '',
  whosampledCount: 0,
}

const peak = (buffer: AudioBuffer) => {
  let max = 0
  for (const sample of buffer.getChannelData(0)) max = Math.max(max, Math.abs(sample))
  return max
}

describe('renderOffline (real OfflineAudioContext)', () => {
  beforeEach(() => {
    clearSliceBufferCache()
    LoadedFiles.set([loudFile])
    Layers.set([{ filename: 'Loud', volume: 100, pitch: 0 }])
    Arrangement.set([{ stepNumToPlay: 0, startStep: 0 }])
    BPM.set(120)
    Swing.set(0)
    NumBars.set(1)
    Saturation.set(0)
    FillGaps.set(false)
    ShortenNotes.set(false)
  })

  it('never exceeds full scale', async () => {
    const buffer = await renderOffline()
    expect(peak(buffer)).toBeLessThanOrEqual(1)
  })

  it('renders at the exact arrangement length', async () => {
    const buffer = await renderOffline()
    expect(buffer.length).toBe(Math.round((60 / 120 / 4) * 44100 * 16))
  })

  it('folds a tail that runs past the loop end back to the start', async () => {
    // A note on the last step of the bar, with a slice long enough to overrun it.
    Arrangement.set([{ stepNumToPlay: 0, startStep: 15 }])
    const buffer = await renderOffline()
    expect(Math.abs(buffer.getChannelData(0)[0])).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run the browser test**

Run: `npm run test:browser`
Expected: PASS (3 tests).

- [ ] **Step 4: Confirm the jsdom suite still passes**

Run: `npm run test:run`
Expected: PASS, and the browser test is excluded from the jsdom run.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: add real OfflineAudioContext golden checks for render levels and tail fold"
```

---

## Task 14: Export through the offline renderer

**Files:**
- Modify: `src/actions/exportCombined.ts`, `src/actions/exportLayer.ts`
- Test: `src/actions/exportCombined.test.ts`, `src/actions/exportLayer.test.ts`

**Interfaces:**
- Consumes: `renderOffline`, `audioBufferToSamples` (Task 12), `downloadAsWav` (unchanged).
- Produces: `exportCombined(): Promise<void>`, `exportLayer(layer: Layer): Promise<void>` — both now async.

- [ ] **Step 1: Update the tests to the async signature**

```ts
// src/actions/exportCombined.test.ts
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
```

- [ ] **Step 2: Write the exportLayer test**

Same shape as the test above, in `src/actions/exportLayer.test.ts`: mock
`renderOffline` and `downloadAsWav`, call `exportLayer({ filename: 'Amen', volume: 100, pitch: 0 })`,
and assert (a) `renderOffline` was called with `{ layers: [thatLayer] }` and
(b) `downloadAsWav` was called with `'Jungle Tool Break - Amen'`.

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/actions/exportCombined.test.ts src/actions/exportLayer.test.ts`
Expected: FAIL — both still import `getArrangementSamples`.

- [ ] **Step 4: Rewrite both actions**

```ts
// src/actions/exportCombined.ts
import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import { downloadAsWav } from './downloadAsWav'

export const exportCombined = async () => {
  const buffer = await renderOffline()
  downloadAsWav(audioBufferToSamples(buffer), 'Jungle Tool Break')
}
```

```ts
// src/actions/exportLayer.ts
import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import type { Layer } from '../lib/types'
import { downloadAsWav } from './downloadAsWav'

export const exportLayer = async (layer: Layer) => {
  const buffer = await renderOffline({ layers: [layer] })
  downloadAsWav(audioBufferToSamples(buffer), `Jungle Tool Break - ${layer.filename}`)
}
```

- [ ] **Step 5: Update the callers to await**

`ExportModal.tsx` calls both. Make its handlers async and await the calls, disabling the button while in flight.

- [ ] **Step 6: Run tests and commit**

Run: `npx vitest run src/actions/exportCombined.test.ts src/actions/exportLayer.test.ts src/modals/ExportModal.test.tsx`
Expected: PASS.

```bash
git add -A
git commit -m "feat: export through the offline renderer"
```

---

## Task 15: Async waveform hook, delete the old render helpers

**Files:**
- Modify: `src/hooks/useArrangementSamples.ts`, `src/hooks/useArrangementStates.ts`
- Delete: `src/helpers/getArrangementSamples.ts`, `getArrangementSamples.test.ts`, `getArrangementLayerSamples.ts`, `getArrangementLayerSamples.test.ts`, `getPitchAdjustedSliceSamples.ts`, `getPitchAdjustedSliceSamples.test.ts`
- Test: `src/hooks/useArrangementSamples.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `renderOffline` (Task 12), `mono` (`src/lib/audio.ts`, unchanged).
- Produces: `useArrangementSamples(p: { bar?: number }): Float32Array | null`.

**Two subscription bugs fixed here:** `useArrangementStates` omits `ShortenNotes`, so the drawn waveform does not update when it is toggled. `NumBars` is also absent — not a live bug today because `ArragementWaveform` subscribes to it directly, but it belongs in the hook so the hook is genuinely the single redraw trigger.

- [ ] **Step 1: Write the failing test**

```tsx
// src/hooks/useArrangementSamples.test.tsx
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/hooks/useArrangementSamples.test.tsx`
Expected: FAIL — the hook is still synchronous and calls `getArrangementSamples`.

- [ ] **Step 3: Rewrite the hook**

```ts
// src/hooks/useArrangementSamples.ts
import { useEffect, useState } from 'react'
import { mono } from '../lib/audio'
import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import { useArrangementStateValues } from './useArrangementStates'

const DEBOUNCE_MS = 150

/**
 * Renders the arrangement offline for drawing. Debounced and asynchronous, so
 * a slow redraw can never stutter or delay playback -- the scheduler owns
 * audio and shares nothing with this path but the planning function.
 */
export const useArrangementSamples = (p: { bar?: number }) => {
  // Subscribe so the hook re-runs on any arrangement-affecting change, and
  // use the values as the effect's dependency key. Without a dependency array
  // the effect would re-run on every render and setSamples would loop forever.
  const values = useArrangementStateValues()
  const [samples, setSamples] = useState<Float32Array | null>(null)
  const key = JSON.stringify({ ...values, bar: p.bar })

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(async () => {
      const buffer = await renderOffline({ bar: p.bar })
      if (!cancelled) setSamples(mono(audioBufferToSamples(buffer)))
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return samples
}
```

- [ ] **Step 4: Add the missing subscriptions**

In `src/hooks/useArrangementStates.ts`, import `ShortenNotes` and `NumBars` from
`../lib/store`, add `ShortenNotes.useState()` and `NumBars.useState()` to
`useArrangementStates`, and add `shortenNotes: ShortenNotes.useState()` and
`numBars: NumBars.useState()` to `useArrangementStateValues`. The hook in Step 3
keys its effect off `useArrangementStateValues`, so anything missing from there is
a change that silently fails to redraw the waveform.

- [ ] **Step 5: Delete the old render helpers**

```bash
git rm src/helpers/getArrangementSamples.ts src/helpers/getArrangementSamples.test.ts
git rm src/helpers/getArrangementLayerSamples.ts src/helpers/getArrangementLayerSamples.test.ts
git rm src/helpers/getPitchAdjustedSliceSamples.ts src/helpers/getPitchAdjustedSliceSamples.test.ts
```

- [ ] **Step 6: Run the full suite**

Run: `npm run test:run`
Expected: PASS. Fix any remaining importers the compiler flags (`npx tsc -b`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: render the arrangement waveform asynchronously, delete offline render helpers"
```

---

## Task 16: Library previews without Tone

**Files:**
- Modify: `src/actions/playSlice.ts`, `playFile.ts`, `playTrim.ts`, `src/lib/audio.ts`, `src/lib/store.ts`, `src/lib/playback.ts`, `src/layout/Library/FileEditor/LibraryWaveform.tsx`
- Test: the three action tests, `src/lib/audio.test.ts`

**Interfaces:**
- Consumes: `getAudioContext` (Task 2).
- Produces: `playSamples(samples: [Float32Array, Float32Array], opts?: { loop?: boolean }): AudioBufferSourceNode` in `src/lib/audio.ts`, replacing `createPlayer`. `PreviewSource = singletonState<AudioBufferSourceNode | null>(null)` in the store, replacing `Player`.

**Do not** switch `LibraryWaveform`'s `isPlaying` to the `Playing` atom: `playSlice.ts:12`, `playFile.ts:11` and `playTrim.ts:12` all set `Playing.set(false)`, because `Playing` means "the arrangement is playing". It reads `PreviewSource` instead.

- [ ] **Step 1: Write the failing test for playSamples**

```ts
// append to src/lib/audio.test.ts
import { playSamples } from './audio'
import { resetAudioContext } from './audioContext'

describe('playSamples', () => {
  beforeEach(() => resetAudioContext())

  it('starts a source with the samples scaled into -1..1', () => {
    const samples: [Float32Array, Float32Array] = [
      Float32Array.from([32768, 0]),
      Float32Array.from([32768, 0]),
    ]
    const source = playSamples(samples) as unknown as {
      startedAt: number | null
      buffer: { getChannelData: (c: number) => Float32Array }
    }
    expect(source.startedAt).not.toBeNull()
    expect(source.buffer.getChannelData(0)[0]).toBeCloseTo(1, 4)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/audio.test.ts`
Expected: FAIL — `playSamples` is not exported.

- [ ] **Step 3: Add playSamples and remove createPlayer**

```ts
// in src/lib/audio.ts — replaces createPlayer
import { getAudioContext } from './audioContext'

const SAMPLE_SCALE = 2 ** 15

/** One-shot playback of raw 16-bit-scale samples, for Library previews. */
export const playSamples = (
  samples: [Float32Array, Float32Array],
  opts?: { loop?: boolean }
) => {
  const ctx = getAudioContext()
  const buffer = ctx.createBuffer(2, samples[0].length, SAMPLE_RATE)
  for (const [channel, data] of samples.entries()) {
    const target = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i++) target[i] = data[i] / SAMPLE_SCALE
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = opts?.loop ?? false
  source.connect(ctx.destination)
  source.start()
  return source
}
```

Delete `createPlayer` and its `Tone` import from `src/lib/audio.ts`.

- [ ] **Step 4: Swap the store atom**

In `src/lib/store.ts`, replace:

```ts
export const Player = singletonState<Tone.Player | null>(null)
```

with:

```ts
export const PreviewSource = singletonState<AudioBufferSourceNode | null>(null)
```

and delete the `Tone` type import.

- [ ] **Step 5: Update the three preview actions**

Each follows the same shape — `playSlice.ts` shown in full; apply the same pattern to `playFile.ts` and `playTrim.ts` (the latter keeping `loop: true` and its leading `stopPreview()`):

```ts
// src/actions/playSlice.ts
import { getSliceSamples } from '../helpers/getSliceSamples'
import { playSamples } from '../lib/audio'
import { resumeAudioContext } from '../lib/audioContext'
import { LoadedFiles, Playing, PreviewSource } from '../lib/store'
import { calculateDuration, stopPreview, startPreview } from '../lib/playback'

export const playSlice = async (fileIndex: number, sliceIndex: number) => {
  Playing.set(false)
  stopPreview()
  await resumeAudioContext()

  const file = LoadedFiles.ref()[fileIndex]
  const samples = getSliceSamples(file, sliceIndex)

  const source = playSamples(samples)
  PreviewSource.set(source)
  source.onended = () => stopPreview()
  startPreview(calculateDuration(samples[0].length))
}
```

In `src/lib/playback.ts`: rename `startPlayback` to `startPreview(durationInSeconds: number | null)` (it now only sets `PlayStartTimestamp` / `PlayDuration`), point `stopPreview` at `PreviewSource` instead of `Player`, and delete `setupPlayback`, `disposePlayer` and `setupPlayerStopHandler`.

- [ ] **Step 6: Update LibraryWaveform**

`LibraryWaveform.tsx:85` becomes `isPlaying={!!playStartTimestamp && PreviewSource.useState() !== null}`. Keep `playStartTimestamp` and `playDuration` — the preview intentionally stays on wall-clock timing.

- [ ] **Step 7: Run the full suite and commit**

Run: `npm run test:run`
Expected: PASS.

```bash
git add -A
git commit -m "feat: play Library previews through Web Audio instead of Tone"
```

---

## Task 17: Remove Tone

**Files:**
- Delete: `src/lib/tone.ts`
- Modify: `src/test/setup.ts`, `package.json`

- [ ] **Step 1: Confirm nothing imports Tone**

Run: `grep -rn "tone" src --include='*.ts' --include='*.tsx' | grep -v "\.test\."`
Expected: no matches.

- [ ] **Step 2: Delete the module and the mock**

```bash
git rm src/lib/tone.ts
```

Delete the `vi.mock('../lib/tone', ...)` block from `src/test/setup.ts`. Leave the fake Web Audio globals from Task 1 in place.

- [ ] **Step 3: Remove the dependency**

Run: `npm uninstall tone`

- [ ] **Step 4: Verify the whole thing**

Run: `npm run test:run` — Expected: PASS.
Run: `npx tsc -b` — Expected: no errors.
Run: `npm run lint` — Expected: no errors.
Run: `npm run dev`, then in the browser: press Play, toggle grid notes mid-loop, drag volume / pitch / saturation, and confirm playback never restarts. Change BPM and confirm it takes effect at the loop boundary. Export and confirm the file matches what you heard.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Tone.js"
```

---

## Verification checklist

Run after Task 17 and confirm each against the spec:

- [ ] Toggling a grid note mid-loop changes the audio without a restart.
- [ ] Dragging volume, pitch or saturation applies without a restart; volume and saturation affect already-sounding notes.
- [ ] BPM, swing and bar-count changes take effect at the loop boundary, not immediately, and never mid-pass.
- [ ] The playhead never jumps backwards at the loop boundary.
- [ ] Editing a slice in the Library changes what the arrangement plays (cache invalidation).
- [ ] Randomise layers swaps layers without a gap and starts playback if stopped.
- [ ] Removing the last layer stops playback.
- [ ] Export matches playback, including a note tail that wraps past the loop end.
- [ ] Library previews still play and their playhead still animates.
