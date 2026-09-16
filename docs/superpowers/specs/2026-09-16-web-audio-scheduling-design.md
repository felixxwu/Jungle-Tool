# Web Audio realtime scheduling

Date: 2026-09-16
Status: Approved, ready for planning

## Problem

Jungle Tool renders the entire arrangement into a single stereo buffer every time
anything changes, then loops it with a `Tone.Player`. Any edit — toggling one grid
note, nudging a slider — triggers a full re-render (including sinc resampling of
every slice) on the main thread, followed by a player restart. Playback audibly
stops and starts, and the UI blocks while the buffer is rebuilt.

**Goal: edits apply seamlessly mid-loop.** Playback must never restart in response
to an edit.

Explicit non-goals: reducing CPU for its own sake, and enabling new capabilities
such as per-note pitch, live automation, effects or MIDI input. Those may follow,
but nothing here is designed for them.

## Approach

Replace the offline render-and-loop with a Web Audio graph driven by a lookahead
scheduler. Each note becomes an `AudioBufferSourceNode` scheduled a short time
ahead of the playhead, so a note that has not yet been scheduled reflects the
current state of the store.

The design splits hard into:

- a **pure planning layer** that decides what should play and when, and
- a **thin imperative layer** that turns that decision into Web Audio nodes.

The planning layer contains all the musical logic and is fully unit-testable with
no audio context. The imperative layer is small enough to verify with a fake
context. The same planning output feeds both the live `AudioContext` and an
`OfflineAudioContext`, which is what keeps playback and export identical.

### Approaches considered and rejected

- **Hybrid: pre-render per layer per bar and schedule those buffers.** Less code
  churn, but a grid edit still costs a layer re-render on the main thread, pitch
  still goes through sinc resampling, and the overlapping-notes bug survives. Most
  of the effort, most of the problems.
- **Keep the full offline render, crossfade buffers at the loop point.** Removes
  the restart glitch only. Edits land when the whole arrangement wraps — up to
  ~24 s at 16 bars / 160 BPM — and the blocking re-render remains. Does not meet
  the goal.

## Decisions

These were settled during design and constrain everything below.

1. **Master chain is redesigned, not preserved.** Today's "normalize only if the
   summed peak exceeds 2^15, then waveshape" has no realtime equivalent, because
   the future peak of the mix is unknowable. The new chain is per-layer gain → sum
   → waveshaper → master trim → destination. **No normalize stage and no limiter.**

   A consequence to be explicit about: `WaveShaperNode` defines its curve over
   [-1, 1] and **clamps out-of-range input to the endpoint**, so anything hotter
   than ±1 is hard-clipped — including at saturation 0, where today's path is
   transparent at any level because `sineSaturation`'s dry term is unbounded
   (`src/lib/audio.ts:98`). Today `getArrangementSamples.ts:37-39` normalizes before
   saturating, so the shaper never sees over-range input. Two layers at high volume
   reach ±1 routinely (the default `Layers` in `store.ts:25-28` is volume 50 +
   volume 100). A **fixed master trim gain** before the destination gives headroom
   so this is rare in practice, but loud arrangements will clip, and that is the
   accepted cost of having no limiter.
2. **Class A edits apply immediately; Class B edits apply at the next loop
   boundary.**
   - Class A (immediate): grid notes, layer volume, layer pitch, saturation, note
     length, note fade out, Fill Gaps, Shorten Notes, randomise layers, adding and
     removing layers, and slice edits in the Library (which invalidate buffers).
     `SelectedBar` affects only the view and is not a playback parameter.
   - Class B (loop boundary): BPM, swing, number of bars.
   Because Class B is deferred to the boundary, tempo is constant within a pass
   and **no mid-loop retiming logic is needed anywhere**, including the playhead.
3. **Tone.js is removed entirely**, including from the Library preview path.
4. **Pitch shifting moves to `playbackRate`**, i.e. the browser's resampler,
   replacing wavefile's sinc resampler. Character may differ subtly at extreme
   pitch settings. Playback and export remain consistent with each other, but a
   re-exported old project will not be byte-identical to a previous export.

## Architecture

### New modules

| Module | Responsibility |
|---|---|
| `lib/audioContext.ts` | Lazy singleton `AudioContext`; `resume()` on first user gesture (replaces `Tone.start()`). |
| `lib/audioBuffers.ts` | `getSliceBuffer(file, sliceIndex, fillGaps)` → `AudioBuffer`, cached. Converts 16-bit-scale samples to −1..1 (÷ 2^15) and builds the Fill Gaps reversed-append variant. |

**Cache key.** Slice boundaries are editable at runtime (`updateSliceStart`,
`addSlice`, `autoSlice`), which is why today's cache key includes `slice.start` and
`nextSlice?.start` (`getPitchAdjustedSliceSamples.ts:24-28`). The new key must do
the same — `(filename, sliceIndex, slice.start, nextSlice?.start, fillGaps)` —
otherwise editing a slice in the Library leaves a stale buffer cached forever and
playback keeps using the old boundaries. Pitch, volume, note length and saturation
are *not* in the key, which is the churn this design removes.
| `helpers/getScheduledNotes.ts` | **Pure core.** Store values + step range → `ScheduledNote[]`. Owns swing, step→seconds, slice lookup, pitch→playbackRate, gain, fade times. No audio types in its signature. |
| `lib/saturationCurve.ts` | Builds the `WaveShaperNode` curve from `Saturation`, porting the sine shaping and pre-gain mapping from `sineSaturation`. Pure. 4096-point curve, node `oversample: '4x'` to limit aliasing. |
| `lib/graph.ts` | `buildGraph(ctx)` → `{ layerGains, master, trim }`. Accepts any `BaseAudioContext`, so live and offline share it. Layer gains are keyed by layer **filename**, not index. |
| `lib/scheduler.ts` | The lookahead loop: owns the loop clock, applies the Class B snapshot, fires notes. Exposes `getLoopPosition()`. |
| `lib/offlineRender.ts` | `renderOffline({ bars, layers })` → `Promise<AudioBuffer>` via `OfflineAudioContext`, using the same `getScheduledNotes` and `buildGraph`. Serves export and the drawn waveform. |

### ScheduledNote

```ts
type ScheduledNote = {
  layerIndex: number
  filename: string
  sliceIndex: number
  timeInSeconds: number      // relative to the start of the current loop pass
  playbackRate: number       // 2 ** (pitch / 12)
  fadeStartSeconds: number | null  // null when Shorten Notes is off
  fadeEndSeconds: number | null
}
```

**Layer volume is deliberately not a field here.** It lives on the persistent layer
`GainNode`, which `buildGraph` creates identically for the live and offline
contexts, so live/offline parity is preserved without baking volume per note — and
volume changes then apply to already-sounding notes. Putting it in both places
would apply it twice; putting it only in `ScheduledNote` would make it unable to
affect sounding notes.

### Signal path

```
AudioBufferSourceNode (playbackRate)
  → note GainNode (Shorten Notes ramp)
    → layer GainNode (volume)
      → master WaveShaperNode (saturation)
        → master trim GainNode (fixed headroom, also the stop ramp)
          → destination
```

### Deleted

`getArrangementSamples`, `getArrangementLayerSamples`, `getPitchAdjustedSliceSamples`
(and its cache and the sinc resampling), `lib/tone.ts`, `createPlayer`,
`restartPlayback`, `useRestartPlayback`, most of `lib/playback.ts`, the `Player`
store atom, and the `tone` dependency.

Untouched: `getSliceSamples`, `stereoSlice`, `getStepSize`,
`getSliceIndexFromStepNum`, `findClosestZeroCrossing`, `autoSlice`, and the whole
Library and slicing surface. These operate on raw sample arrays and are unaffected.

## The scheduler

State: `loopStartTime` (the `ctx.currentTime` at which step 0 of the current pass
began), `nextStepIndex`, and the Class B snapshot (`bpm`, `swing`, `numBars`).

Every 25 ms it schedules any step falling within the next 100 ms, then advances.
When `nextStepIndex` wraps to 0 it re-snapshots the Class B values and resets
`loopStartTime`. **That snapshot is the entire Class B implementation** — no queue,
no extra store state.

**The lookahead may cross the loop boundary**, and the Class B snapshot is taken at
the moment step 0 is *scheduled*, not when it is heard. So the scheduler never has
to stop at the boundary and there is no scheduling gap at the loop point. This is
also precisely why a Class B change made in the final ~100 ms of a pass lands one
pass later — step 0 of the next pass has already been scheduled under the old
snapshot.

Class A values are read via `.ref()` on each tick, so Class A edits need no wiring
at all. Nothing subscribes to the store for playback purposes; React subscriptions
remain only for redrawing the waveform.

Per note: create the source with `playbackRate`, connect through a note gain to the
layer gain, and `start(loopStartTime + timeInSeconds)`. With Shorten Notes on, the
note gain gets `setValueAtTime(1, fadeStart)` + `linearRampToValueAtTime(0, fadeEnd)`
and the source is stopped at `fadeEnd`; with it off, the slice rings to the end of
its buffer, matching today's behaviour.

### Node-level parameters vs scheduled parameters

Two Class A parameters live on persistent nodes rather than on scheduled notes, so
they need an explicit update path:

- **Saturation** sets `master.curve`. The scheduler rebuilds the curve from
  `saturationCurve` only when the value has actually changed (checked on each tick).
- **Layer volume** sets the layer `GainNode`, via `setTargetAtTime` with a ~15 ms
  time constant rather than a direct assignment, to avoid zipper noise while
  dragging the slider. The same applies to the master output gain.

A curve swap is applied directly. It can click in principle, but only while the
saturation slider is being dragged, and cross-fading two waveshapers to avoid it is
not worth the complexity.

**Domain rescaling.** `sineSaturation` (`src/lib/audio.ts:83-102`) operates in
±2^15 sample space: it clips at `maxValue = 2 ** 15`, then computes
`sin(clipped * PI / 2 / maxValue) * maxValue`. Web Audio's `WaveShaperNode` works in
±1. Ported to that domain the curve collapses to `sin(x * PI / 2)` over clipped
input, with the pre-gain and the `mix` blend unchanged. Porting the ±2^15 constants
literally would produce silently wrong saturation.

Because both sit downstream of already-scheduled sources, changes to them apply to
currently sounding notes too — effectively instantly, rather than within the
lookahead window. Pitch and the note envelope, by contrast, are baked into each
source at schedule time and so follow the ~100 ms rule below.

### A changing layer list

`Layers` is mutated mid-session: `addToArrangement.ts:12-17` pushes a layer,
`randomiseLayers.ts:8` empties it and refills it at `:27`, and layers can be
removed. So `buildGraph`'s layer gains cannot be built once and held.

- Layer gains are stored in a map keyed by **layer filename**, created lazily on
  first use and pruned when a layer disappears. `ScheduledNote.layerIndex` is
  therefore replaced by the existing `filename` field as the routing key, since
  indices are not stable across a randomise.
- While `Layers` is empty the scheduler schedules nothing and keeps running; it
  resumes when layers reappear. This covers `randomiseLayers`' transient empty
  window without special-casing it.
- `useRestartPlayback.ts:17-23` currently stops playback when the last layer is
  removed. That rule is rehomed: the scheduler stops itself when `Layers` is empty
  **and** the emptiness was not caused by an in-flight randomise. Simplest correct
  form: `randomiseLayers` stops setting `Layers` to `[]` at all and swaps the list
  in one atomic set, after which "empty means stop" needs no exception.

### Stopping

The scheduler keeps no handles on scheduled sources, so Stop cannot work by calling
`stop()` on each note. Instead: cancel the tick interval, ramp the master output
gain to 0 over ~20 ms, then disconnect and rebuild the graph. This silences
already-scheduled and currently-sounding notes without per-note bookkeeping, and
without the click a hard disconnect would produce.

`stopPlayback` (`src/lib/playback.ts:16-21`) currently serves both the arrangement
and the Library preview, and is called from `BottomBar/index.tsx:24`,
`useWindowListeners.ts:15`, `TrimEditor.tsx:27` and `playTrim.ts:23`. It splits into
`stopArrangement()` (the scheduler ramp above) and `stopPreview()` (stop the
preview source and clear `PlayStartTimestamp` / `PlayDuration`). Call sites are
updated to whichever they mean; `useWindowListeners`' spacebar handler means the
arrangement.

### Accepted latency consequences

- Edits apply within ~100 ms rather than instantly.
- A note already inside the lookahead window still plays if deleted within that
  window. We deliberately do not keep handles to cancel it: ~100 ms of wrongness
  does not justify the bookkeeping.
- A Class B change made in the final ~100 ms of a pass lands one pass later.

### Randomise layers

`randomiseLayers.ts:29` currently ends with an unconditional `await
playArrangement()`, so randomising *starts* playback even when the user was not
playing. With restart-on-edit gone there is nothing left for that call to do
mechanically, but silently dropping it would remove user-visible behaviour. The
decision: **preserve it** — if the arrangement is not playing, randomising starts
it; if it is playing, the new layers are picked up on the next tick with no restart.

### Adding and removing bars

`addBars` and `removeBars` (`src/layout/Arrangement/Main/BarSelection/index.tsx:58-85`)
mutate `Arrangement` (Class A, immediate) and `NumBars` (Class B, boundary) in the
same click, so the two straddle the split. The resulting behaviour is defined as:
the current pass keeps its old length, and the note changes take effect immediately
within it. Removing a bar therefore plays the removed bar as silence for the
remainder of the pass; adding one makes the copied notes audible only from the next
pass, when the longer length takes effect. Both are coherent and neither requires
mid-pass retiming.

### Pitch direction

Today `pitchMult = 1 / 2 ** (pitch / 12)`, resampling to `44100 * pitchMult` and
playing back at 44100 — a net speed ratio of `2 ** (pitch / 12)`. So
`playbackRate = 2 ** (pitch / 12)` reproduces the existing direction and amount.

### Fill Gaps

The reversed-append is applied to the raw slice buffer rather than after
resampling. Since `playbackRate` scales the whole buffer uniformly, the
gap-filling property is preserved.

## Playhead

`Waveform`, `ArragementWaveform` and `BarSelection` currently each derive position
from `Date.now() - PlayStartTimestamp` plus a BPM-derived bar duration, polled on
`setInterval`. All three switch to a single source of truth: `getLoopPosition()`
on the scheduler, derived from `ctx.currentTime`, read on `requestAnimationFrame`.
This removes drift and stays correct across a tempo change.

**The scheduler must keep two clocks, not one.** `loopStartTime` is a *scheduling*
cursor: because the lookahead crosses the loop boundary, it points at the next
pass's start for the last ~100 ms of the audible pass. Deriving the playhead from it
would make `ctx.currentTime - loopStartTime` negative once per pass and the playhead
would jump backwards every loop. `getLoopPosition()` therefore reads a separate
`currentPassStartTime`, advanced when a pass actually begins rather than when it is
scheduled.

**Latency caveat.** `ctx.currentTime` leads what the user hears by
`baseLatency + outputLatency` (typically 20–50 ms). This is a small constant offset
rather than the accumulating drift of the current `Date.now()` approach, and
`getLoopPosition()` subtracts it so the drawn playhead matches what is audible.

`PlayStartTimestamp` and `PlayDuration` remain in the store, used only by the
Library preview path (`playSlice`, `playFile`, `playTrim`), where one-shot
wall-clock timing is adequate. Those three actions swap `Tone.Player` for a plain
`AudioBufferSourceNode` and otherwise keep their current shape.

**`Waveform` is a shared component and needs both modes.** It drives the arrangement
playhead *and* the Library preview playhead (`LibraryWaveform.tsx:85`), and the
preview keeps wall-clock timing. So `Waveform` gains an explicit arrangement mode
(rAF reading `getLoopPosition()`, writing `transform` per frame) alongside the
existing library mode. Note this is a rewrite of that component's animation model,
not a swap of time source: today it drives a WAAPI `playHead.animate(...)` restarted
on each bar wrap (`Waveform.tsx:102-108`).

`isPlaying` checks switch to the `Playing` atom **only for the arrangement**
(`ArragementWaveform.tsx:34`, `BarSelection/index.tsx:25`). `LibraryWaveform.tsx:85`
must not, because `playSlice.ts:12`, `playFile.ts:11` and `playTrim.ts:12` all set
`Playing.set(false)` — `Playing` means "the arrangement is playing". The `Player`
atom is replaced by a `PreviewSource` atom (`AudioBufferSourceNode | null`) that the
preview path and `LibraryWaveform` use in its place.

## Offline path: export and waveform

`renderOffline({ bars, layers })` creates an
`OfflineAudioContext(2, Math.round(stepSize * 16 * bars), 44100)` — the length
argument must be an integer and `getStepSize` returns a float
(`getStepSize.ts:9`); today's code rounds at `getArrangementSamples.ts:15`. It calls
the same `buildGraph`
and `getScheduledNotes` over the full range, schedules every note, and awaits
`startRendering()`.

- `exportCombined` renders all bars; `exportLayer` renders with a single layer in
  the layers list. Both convert the resulting `AudioBuffer` back to 16-bit scale
  (× 32767) and hand it to `downloadAsWav`, which is unchanged. The asymmetry with
  `audioBuffers`' ÷ 2^15 on the way in is deliberate and asymmetric by one LSB:
  2^15 on the way in guarantees the normalised value never exceeds 1.0, while 32767
  on the way out is the largest value representable in signed 16-bit. Do not "fix"
  it to be symmetric in either direction — ÷32767 could produce over-unity input to
  the shaper, and ×32768 would overflow on full-scale samples.
- `useArrangementSamples({ bar })` becomes asynchronous — `useState` + `useEffect`
  over the arrangement state values, debounced ~150 ms, returning
  `Float32Array | null`. Callers already handle the null case.

### Wrap-around tails

Today a note whose tail runs past the end of the arrangement is **truncated**: the
write at `getArrangementLayerSamples.ts:73-74` indexes past the buffer end and the
typed array silently drops it. Under the scheduler, source nodes simply keep ringing
into the next pass and sum with its opening notes. That is a real, audible change —
and it applies to swung notes on the last step and to any note at all when Shorten
Notes is off, which is the default (`store.ts:42`).

Live wrapping is the desirable behaviour, so **offline render must match it rather
than the reverse**: render `bars` plus a tail of one extra bar, then fold the tail
back onto the start of the buffer before trimming to length. Without this, export
and playback diverge at exactly the most audible point, which would break the
parity guarantee this design exists to provide.

The consequence that matters: the expensive render is entirely off the audio path.
A slow or debounced waveform redraw can no longer stutter, delay or restart
playback.

## Incidental fixes

Both are pre-existing bugs that this work removes as a side effect, and both should
be covered by tests.

- `useArrangementStates` subscribes to `FillGaps` but not `ShortenNotes`, so the
  drawn waveform does not currently update when Shorten Notes is toggled. The new
  subscription list includes it. `NumBars` is also absent from that hook but is not
  a live bug today, because `ArragementWaveform` subscribes to it directly; it
  should move into the hook so the hook is genuinely the single trigger for redraws.
- `getArrangementLayerSamples` assigns (`=`) rather than accumulates, so two
  overlapping notes within one layer truncate each other. Separate source nodes sum
  naturally.
- `getArrangementLayerSamples.ts:50` uses `>` where it should use `>=`, so a note at
  `startStep === (bar + 1) * 16` is included in a single-bar render at
  `relativeStartStep = 16` and written past the buffer end. Benign today because the
  typed array drops it; **not** benign once notes become real scheduled sources with
  no bounds backstop. `getScheduledNotes` must use a half-open bar range, and this
  needs an explicit test.

## Testing

`src/test/setup.ts` currently holds a global `Tone` mock. It is replaced in place by
a fake Web Audio mock: `AudioContext` / `OfflineAudioContext` stubs that record
created nodes and calls, with a manually advanceable `currentTime`. It must also
record `AudioParam` scheduling calls — `setValueAtTime`, `linearRampToValueAtTime`,
`setTargetAtTime` — with their target values and times, since the scheduler tests
assert on fade shapes and gain ramps rather than on rendered audio.

- **`getScheduledNotes` carries the bulk of the tests.** Every musical fact
  currently asserted against `Float32Array` contents in
  `getArrangementLayerSamples.test` and `getPitchAdjustedSliceSamples.test` is
  ported to assertions on the note list: swing offsets on odd steps, pitch ratios,
  note length and fade, the half-open bar range, and slice lookup by `stepNum`.
  Layer volume is deliberately *not* here — it lives on the layer `GainNode`, and is
  tested via the fake context's recorded `AudioParam` calls.
- **`saturationCurve`** is tested directly as a pure function.
- **The scheduler** is tested with fake timers and the fake context: advance
  `currentTime`, assert which notes were scheduled in which window, and assert that
  a BPM change mid-pass does not take effect until the wrap. The Class B boundary
  rule gets an explicit test rather than being an emergent property.
- **The playhead wrap** gets its own test: assert `getLoopPosition()` is monotonic
  across a loop boundary and never negative. This is the seam where the two-clock
  distinction lives, and it is invisible to every other test.
- **`offlineRender`** is mocked for the graph-and-scheduling assertions. But
  **at least one real `OfflineAudioContext` render** is required, via vitest browser
  mode, as a golden-sample check on peak level and on the wrap-around tail fold.
  Step 4 swaps the entire render engine and changes output levels; mocking
  everything would let a clipping or tail-fold regression land unnoticed, and those
  are the two riskiest changes in this spec.

**jsdom has no Web Audio at all.** `audioContext.ts` must not touch
`window.AudioContext` at module load, or every test file that transitively imports
it fails. The singleton is constructed on first `resume()`, not at import.

Deleted rather than ported: `restartPlayback.test`, `useRestartPlayback.test`,
`getArrangementSamples.test`, and the buffer-level parts of `playback.test`.
`integration.test.ts` is reworked against the new flow. The Library and slicing
test surface is untouched.

## Migration order

Each step leaves the app working and the suite green.

1. **Foundations, nothing wired.** `audioContext`, `audioBuffers`,
   `saturationCurve`, `graph`, `getScheduledNotes`, plus the Web Audio test mock
   added alongside the existing Tone mock. Fully tested in isolation.
2. **Scheduler wired to playback.** `playArrangement` and stop drive the scheduler;
   `restartPlayback`, `useRestartPlayback` and the deep-equal config comparison are
   deleted. This step **must** also update `addToArrangement.ts:4,18`, which imports
   and calls `restartPlayback`, and `addToArrangement.test.ts`, whose assertions
   about playback restarting on layer add no longer describe the design (that
   behaviour was added deliberately in commit `5df1894`; it is superseded, not lost
   — the layer is now picked up on the next tick). Without this the step does not
   compile. **This step delivers the goal** — edits apply mid-loop from here on.
   Export and the waveform still use the old synchronous path, untouched and still
   correct.
3. **Playhead.** The three components switch to `getLoopPosition()` and the
   arrangement `isPlaying` checks switch to `Playing`. The `Player` atom **stays**
   until step 5, because the Tone-based Library previews and `LibraryWaveform` still
   read it.
4. **Offline path.** `offlineRender` lands; export and `useArrangementSamples`
   switch to it; the three old render helpers are deleted.
5. **Drop Tone.** Library previews move to `AudioBufferSourceNode`; `Player` is
   replaced by the `PreviewSource` atom and `LibraryWaveform` switches to it;
   `stopPlayback` splits into `stopArrangement` / `stopPreview`; `lib/tone.ts`, the
   Tone mock and the `tone` dependency are removed.

Steps 1–2 are the substance; 3–5 are largely deletion.
