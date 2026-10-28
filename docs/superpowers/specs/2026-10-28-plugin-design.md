# Jungle Tool Plugin (VST3 / AU / CLAP) — Design

A free plugin version of Jungle Tool that runs inside a DAW. It reuses the existing React UI and replaces the Web Audio engine with a small native C++ engine.

## Decisions

| Area | Decision |
| --- | --- |
| Framework | JUCE 8, CMake. VST3 + AU from JUCE, CLAP via `clap-juce-extensions`. |
| UI | Existing React/Vite app, served inside JUCE's `WebBrowserComponent`. No native UI rewrite. |
| Audio | New realtime-safe C++ voice engine. Nothing from Web Audio is ported. |
| Modes | MIDI mode (DAW notes trigger slices) built first; Sequencer mode (internal arrangement synced to the DAW transport) second. Both share one voice engine and the same note-length rules, so a pattern sounds the same in either mode (up to swing; see MIDI mode). |
| State owner | The C++ processor. The UI reads state from it when it opens and sends edits to it. |
| Saving | Plugin state (arrangement, mode, slice edits) stored in the DAW project via `getStateInformation` / `setStateInformation`. |
| Randomiser → DAW | Drag the arrangement out of the plugin as a `.mid` clip. |
| Breaks | The existing `public/library/*.json` files (WAV as base64 + slices), shipped as-is in a shared folder next to the plugin. |
| Cut from the plugin | Firebase/auth, WAV export, Download modals, porting auto-slice to C++, presets beyond the factory breaks, role-mapped ("next kick") MIDI. |
| Web app | Keeps working as-is on Web Audio. It shares the UI code but gets no plugin-only features. |

## Repo layout

Same repo, new top-level folder:

```
plugin/
  CMakeLists.txt        JUCE + clap-juce-extensions, VST3/AU/CLAP targets, headless render CLI
  Source/
    PluginProcessor.*   audio callback, state save/load, MIDI + transport handling
    PluginEditor.*      WebBrowserComponent + native "Drag MIDI" strip
    Engine.*            voices, resampling, saturation, layer gains
    Scheduling.*        C++ port of getScheduledNotes
    Bridge.*            JSON messages between the web UI and the processor
    Breaks.*            loads and shares break JSONs across plugin instances
src/                    shared React UI (unchanged location)
```

The UI is built twice from the same source. `vite build` produces the web app. `vite build --mode plugin` produces the plugin UI, which JUCE embeds as binary resources. A single `IS_PLUGIN` flag (from `import.meta.env.MODE`) hides Firebase, export modals and other web-only UI, and shows the plugin-only UI: the mode switch and the drag strip.

## Audio engine boundary

Today the UI calls `playArrangement`, `playSlice`, `playTrim` etc., which drive `src/lib/scheduler.ts` and Web Audio. In the plugin build those calls go to the bridge instead.

- One TypeScript interface (`AudioEngine`) covering what the UI needs: play/stop arrangement, preview a whole break (`playFile`, the most common preview), preview slice, preview trim, send edits, read state, read playhead position.
- `WebAudioEngine` wraps the existing code. `PluginEngine` sends JSON messages to C++ through JUCE's native function bridge.
- **The processor owns the state.** The editor and its web view are destroyed whenever the plugin window closes, so on open the UI asks the processor for the current state and loads it into the store. Edits from the UI go to the processor. Changes made on the C++ side (DAW automation, project load) are pushed back to the UI.
- The audio thread reads a snapshot of the state through an atomic pointer swap, never a lock. Snapshots it no longer uses, and break buffers no layer uses, go on a list that the message thread frees, so `processBlock` never frees memory or reads memory that's already been freed.
- C++ pushes the playhead position back about 30 times per second for the grid's play-head line. In MIDI mode there's no arrangement position, so the play-head shows only while auditioning.
- Slice and trim previews play through the same voice engine on their own path, so they work in both modes whether or not anything is playing. In the web app they skip the layer gain, saturation and trim (`playSlice`/`playTrim` → `playSamples`), which makes them about 10 dB louder than the arrangement. That figure is the 0.3 trim alone. In the plugin, previews (whole break, slice and trim) go through the 0.3 master trim, still without layer gain or saturation. Saturation adds level to the mix (at the default of 50 it's fully wet `sin(x·π/2)`, about +3.9 dB at low levels), so previews sit a few dB under the arrangement rather than exactly at its level. The trim preview keeps looping until stopped.
- **What "playing" means in the UI.** The UI's `Playing` flag drives a lot: whether clicking a break in `FileList` adds a live preview layer or plays the file, the arrangement waveform, bar selection and the bottom bar. In the plugin, `Playing` is true while auditioning **or** while the DAW plays. So clicking a break during DAW playback adds it in time as a preview layer, as it does during playback in the web app.
- **Space bar belongs to the DAW.** The web app toggles playback on space (`useWindowListeners`). In the plugin the web view passes space through to the host instead, so space starts and stops the DAW even while the plugin window has focus.
- **Previews never outlive the editor.** The web app only reverts a preview layer or an in-progress "R" replace (`useCleanupTempLayer`) when the user switches tab. In the plugin the window can close mid-preview, so the processor itself drops preview layers and replace overlays when the editor closes. `getStateInformation` never saves them.

### Saved state

```
{
  version,            // migrated in C++, see below
  mode,               // 'midi' | 'sequencer'
  arrangement,        // existing ArrangementState
  sliceEdits,         // { [factory break name]: Slice[] } — only factory breaks this project changed
  userBreaks          // { id, name, trimStart, trimEnd, slices }[] — imported breaks used by this project
}
```

- **Migration runs in C++.** The processor has to load and play a project, and render an offline bounce, with the plugin window closed, so no UI code is running. The TS side only ever sees the current version. A shared fixture test feeds old-version JSON through the C++ migration.
- **Slice edits are per project.** Edits (`updateSliceStart`, `addSlice`, auto-slice) only live in memory today. In the plugin they're saved per project, so editing a break in one project never changes another. Factory breaks that the project changed go in `sliceEdits`. An imported break's slices are **always** stored in its `userBreaks` entry, edited or not, because on another machine the project may be the only copy. Re-running auto-slice wouldn't reproduce them, since its sensitivity setting isn't saved.
- **Imported breaks are identified by ID.** For an imported break, `Layer.filename` holds its `userBreaks` id, and the UI looks imported breaks up by id rather than by name, so two imports called "break.wav" can't collide. The display name comes from `userBreaks`. Name-based rules work on display names: `randomiseLayers` drops near-duplicates by the part of the name before `(` and skips `'PH Break'`.
- **Missing breaks:** a project whose imported break isn't on this machine loads anyway. That layer stays silent and the UI shows it as missing, with a button to locate the WAV. The slices in `userBreaks` are measured in the trimmed audio, so each entry also stores the import's trim start and end. A located WAV goes through the same steps as the original import, in the same order: resample to 44.1 kHz, normalise, then trim to the stored range. Only then are the stored slices applied, so levels and slice positions line up. Breaks imported as `.json` files have no trim range: for those the user locates the `.json`, which is loaded as-is.

## Voice engine (C++)

What a voice does is what `fireNote` + `getSliceBuffer` do today:

- Play a region of a break from a slice start, at `2^(pitch/12)` times speed, via the layer's gain. The region ends where `getSliceSamples` ends it: at the start of the next slice **in array order**, or at the end of the file. This is a different rule from the Fill Gaps cutoff, which uses the next slice by `stepNum` (see Note length), and the engine needs both. `addSlice` re-sorts slices by start position but `updateSliceStart` doesn't, so after dragging a slice the array order can differ from the start order. Copy the array order as-is so the two engines agree.
- Optional reversed tail for Fill Gaps (original + reversed region, end to end).
- Gain envelope, as `fireNote` computes it (not `getScheduledNotes`):
  - The note stops at the earlier of Shorten Notes' fade end (`noteLength` + `noteFadeOut` ms) and the Fill Gaps cutoff.
  - The fade starts at the earlier of Shorten Notes' fade start (`noteLength` ms) and 5 ms before the stop. Without Shorten Notes, it starts 5 ms before the stop.
  - Gain holds at 1 until the fade starts, then falls linearly to 0 at the stop. So when both are on and the Fill Gaps cutoff is tighter, the fade runs from `noteLength` all the way to the cutoff, not just over the last 5 ms.
- Per-layer volume changes go through a one-pole smoother with a 15 ms time constant, like `setTargetAtTime(…, 0.015)` in `graph.ts`. That's an exponential curve, not a 15 ms straight-line ramp.
- Swapping a layer's break cuts the old break's sounding notes straight away, as in the web app, where swapping disconnects the old break's gain node.
- Saturation, matching `src/lib/saturationCurve.ts`: up to 12 dB of drive above 50%, then `sin(x·π/2)`, mixed with the dry signal. Run it with 4x oversampling, as `graph.ts` does, or it will alias.
  - Clamp the input to ±1 before computing both the wet and the dry terms. `WaveShaperNode` does this, so in the web app a layer sum above 1 hard-clips, including the dry part of the mix.
- Master trim of 0.3 (`masterTrim`).
- **The order matters:** voices → layer gains → saturation (clamp, then shape) → 0.3 trim, as in `graph.ts`. Because the trim comes after the saturation stage, a layer sum above ±1 clips before the trim lowers it, and velocity 127 drives the saturation harder. Using a different order changes both levels and how the saturation sounds.

Break loading matches `loadJson.ts`: decode the base64 WAV (JUCE has base64 and WAV readers), scale from ±2^15 to ±1, then apply the same `normalize()` from `src/lib/audio.ts` so levels match the web app. Copy it exactly, because it isn't a true peak normalise. It scales by the largest **positive** sample (`max()` in `src/helpers/max.ts`), not the largest absolute value, so negative peaks can end up beyond −1. That positive peak lands at (2^15 − 1)/2^15, not exactly 1.

Constraints:

- **Resampling:** breaks are 44.1 kHz (`SAMPLE_RATE`) and hosts run at 44.1/48/96 kHz, on top of per-layer pitch. Use cubic (Hermite) interpolation at minimum. Web Audio did this silently, and a bad interpolator will be audible on pitched-up breaks.
- **Realtime safety:** voices come from a fixed pool allocated up front. No allocation, locks, logging or file access in `processBlock`. Breaks are loaded on a background thread.
- **Voice pool:** 128 voices. Overlapping notes with Fill Gaps off, pitched-down layers, 8 layers, previews and fast MIDI input can all run several voices at once. When the pool is full, the oldest voice is stopped with the 5 ms declick and reused.
- **Not ready yet:** a project bounced straight after opening could render silence while breaks are still loading. When the host reports a non-realtime render (`isNonRealtime()`), `processBlock` waits for loading to finish before rendering.
- **Shared memory:** decoded breaks are shared across every plugin instance in the same process (`SharedResourcePointer`), so ten instances don't load ten copies. Hosts that run plugins in separate processes, such as Logic's out-of-process AU host and Bitwig's sandboxing, load one copy per process.
- **Offline bounce:** output must not depend on wall-clock time, only on samples processed, so a faster-than-realtime render matches playback.

## Note length (both modes)

A note's length is decided per layer by the plugin, with the same rules as `getScheduledNotes` today:

- **Fill Gaps off:** the slice plays to its natural end. Notes can overlap.
- **Fill Gaps on:** slice + reversed copy, cut where **that break's** next slice would start (`stopAtSeconds`): the first slice with a higher `stepNum`, so duplicate stepNums (PH Break, an imported WAV's Start/End) are skipped. For example, a step-0 note fills 1 step on Think (2), which has a step-1 slice, and 2 steps on Amen Brother (1), whose next slice is step 2.
- **Shorten Notes on:** fade out after `noteLength` + `noteFadeOut` ms. The tighter of the two cutoffs wins.

Cutoffs are worked out in steps and converted to samples at note-on, at the tempo at that moment. A note that's already sounding keeps its cutoff if the tempo changes. Notes are at most a bar long, so the error is small, and this keeps voices simple. If the host reports no tempo, for example while stopped, the BPM slider's tempo is used.

## MIDI mode

- **Note mapping.** Note `36 + N` (N = 0–15) plays the slice with `stepNum` N in every layer at once, so the DAW piano roll lines up with the grid rows. The base note is fixed at 36. The UI labels rows by note number, because DAWs name that octave differently (C1 in most, C3 in FL Studio).
- **Missing slices:** a layer with no slice for that step stays silent, as in the sequencer (`getSliceIndexFromStepNum` returns null). Only 5 of the 35 factory breaks have a slice for every step.
- **One-shot:** note-off is ignored. Length comes only from the rules above, so the same pattern sounds identical in MIDI mode and sequencer mode, and stays identical after randomising or swapping breaks.
- **Fill Gaps cutoff:** measured from note-on as (next slice's `stepNum` − this slice's `stepNum`) steps at the host tempo, with no swing. For the break's last slice, the next stepNum is 16, the same as `getScheduledNotes`.
- **Velocity:** gain = velocity / 100, so velocity 100 (what the dragged clip writes) sounds exactly like the sequencer. Velocity 127 is 1.27× and drives the saturation a little harder.
- **Swing:** the plugin doesn't swing incoming notes, because their timing belongs to the DAW. The dragged clip has the swing written into it instead (see drag-out). The only difference from the sequencer is the Fill Gaps cutoff, which in MIDI mode is a straight number of steps rather than the swung position of the next step. With swing on, that's audible but expected:
  - an even-step note stops one step after it starts, leaving a gap the size of the swing before the late odd-step note;
  - an odd-step note runs past the next even-step note's start by the same amount.

## Sequencer mode

The plugin plays the arrangement itself, started and stopped by MIDI notes, like a pattern player:

- Any note-on starts the arrangement from step 0 at that exact sample. It plays, looping every `numBars × 16` steps, until every held note is released; then sounding notes fade out over 20 ms, as `stopScheduler` does. A new note-on while it plays restarts it from step 0. All-notes-off and all-sound-off stop it too.
- So a note in a pattern clip is the on/off switch for the break: where the note starts is where the break starts, from its downbeat, and the note's length is how long it plays. With no notes, sequencer mode is silent.
- Notes fire at their **swung** onset (odd steps delayed by `swing%` of a step, as in `getScheduledNotes`). Each note is placed by its rounded sample offset, so one on a block boundary lands in exactly one block.
- The position counts forward from the note-on in steps at the host tempo, so tempo changes take effect from the next block. It doesn't follow the song position, so DAW loops and jumps don't move it; the notes do.
- `getScheduledNotes`' timing rules are ported to C++, with timings in steps rather than seconds. The TS version stays the reference.
- In sequencer mode MIDI notes only start and stop the arrangement; their pitch and velocity are ignored. A toggle in the UI switches modes.

## Play button (both modes)

The UI's play button auditions the arrangement while the DAW is stopped, in either mode:

- It always starts from step 0, at the BPM slider's tempo. The BPM slider is shown while the DAW is stopped and hidden while it plays.
- When the DAW transport starts, the audition stops. In sequencer mode the DAW-synced playback takes over; in MIDI mode the DAW's notes do.
- When the DAW stops, nothing resumes. Press play again to audition.
- **Randomise:** `randomiseLayers` ends by calling `playArrangement()`. In the plugin that starts the audition only while the DAW is stopped. While the DAW plays, randomise just swaps the breaks, and the DAW's playback picks them up.

## Randomiser → DAW (MIDI drag-out)

The randomiser keeps writing to `Arrangement` as it does now. To get the result into the DAW:

1. `arrangementToMidi(arrangement, numBars, swing)` (new, pure TS, no dependency) builds a Standard MIDI File in memory: format 0, one track, 960 ticks per quarter note (240 per step, fine enough for swing). The clip always covers all bars of the arrangement. For each note it writes note `36 + stepNumToPlay` at tick `startStep * 240`, plus `swing% × 240` on odd steps rounded to the nearest tick (33% is 79.2, so 79), velocity 100. The round-trip test allows for that rounding. Each note ends after one step, or at the next note of the same pitch if that comes sooner. With swing, an odd-step note would otherwise overlap a following even-step note on the same slice, and many DAWs truncate or merge overlapping same-pitch notes on import. Note length doesn't affect the sound, because MIDI mode is one-shot.
2. The UI sends the bytes to C++, which writes the file to a temp folder, named like the WAV export (`exportCombined`): all layers' display names joined with ", ", then ` (Jungle Tool).mid`. File extensions are stripped from imported breaks' names first, so `break.wav` becomes `break`.
3. The user drags from a **native JUCE "Drag MIDI" strip** placed beside the web view. Its mouse-drag handler calls `DragAndDropContainer::performExternalDragDropOfFiles`. It can't sit on top of the web view, because WebView2 on Windows is a separate native window that JUCE can't draw over, and a drag started from inside the web view is unreliable on macOS.
4. Fallback: "Save .mid…" opens a native save dialog with the same file.

Layer randomization (which breaks, pitch, volume) isn't MIDI. It stays plugin state saved in the DAW project, so re-rolling breaks keeps the DAW's pattern and changes the sound.

## Breaks on disk

- **Factory breaks:** the 35 breaks in the `library` list in `src/lib/consts.ts`, as their existing `public/library/<name>.json` files, unchanged. The installer and the index are built from that list, not from `public/library/*.json`, which also contains "Open Field Attack (1)", a break not in the list. They're installed to a system-wide folder: `/Library/Application Support/Jungle Tool/Library` on macOS, `%PROGRAMDATA%\Jungle Tool\Library` on Windows. All three formats read from the same folder.
- **Imported breaks:** the browser file input still provides the file's bytes, and the import goes through the same steps as today. For a WAV that's `loadWav` (which resamples to 44.1 kHz and normalises) → `TrimWarningModal` → `TrimEditor`. "Trim and continue" is the only way out of the trim editor. Until the user trims, the import can't become a layer: previewing it in the arrangement, using it for "R" replace and picking it in the randomiser are all blocked (`isUntrimmed`), in the web app too. It clears the slices and runs auto-slice, so the break's import-time slices are the auto-slice result, and its trim start and end are the Start/End slice positions before trimming. The UI sends the break to C++ right after that auto-slice. `importFile` also accepts break `.json` files, which go through `loadJson` and are saved the same way, without trimming. Trimming replaces the audio, so the UI turns the break into the same JSON format (audio as base64 + its import-time slices) only after that step. The audio is stored as the normalised, trimmed **32-bit float** WAV, and imported breaks are not normalised again when loaded. So a break plays at the same level right after import, after reload and after re-locating, and negative peaks beyond −1 aren't clipped by a 16-bit write. C++ saves it per user under a unique ID, so two imports with the same filename don't overwrite each other: `~/Library/Application Support/Jungle Tool/User/<id>.json` or `%APPDATA%\Jungle Tool\User\<id>.json`. The file is never rewritten afterwards; slices are kept in each project's `userBreaks` entry.
- **Break names vs file names:** a layer refers to a factory break by the `name` field inside its JSON, not by its file name, and 10 of the 35 differ. For example, the file `Think (2).json` contains "Think (About It) (2)", `Amen Brother (1).json` contains "Amen, Brother (1)", and `Mr Sandman.json` contains "Mr. Sandman". This spec's examples use file names.
  - The break index records both names, and the UI uses it to find a break's file from the name a layer stores. Fetching `/library/<layer name>.json` directly would fail for those 10.
  - Everything else keys on the display name (the JSON's `name`), as the web app does today: `Layer.filename`, `sliceEdits` keys, the `(` near-duplicate rule in `randomiseLayers`, and the `.mid` file name. Imported breaks use their id instead (see Saved state).
- **Serving to the UI:** the UI keeps loading with `fetch('/library/<name>.json')` (`App.tsx`). The web view's resource provider maps `/library/` to the factory folder and `/user/` to the user folder.
- **Break index:** the web app fetches and decodes all 35 breaks (17 MB) at start-up, and the plugin's web view would repeat that every time the window opens. But the randomiser (`randomiseLayers`), the library list and the auto pitch/volume helpers (`getBestLayerPitch`, `getBestLayerVolume` with `LowestRMS`) all need every break's details. A build script generates `library/index.json` with each break's name, artist, year, slices, sample length and RMS. In the plugin build those features read the index, and the UI fetches a break's audio only when a layer uses it, it's previewed, or it's opened in the Library tab.
  - This is a refactor of its own. 26 source files use `LoadedFiles` and 15 use `SelectedFileIndex`, mostly as an array of fully decoded breaks indexed by position: the Library editor, the waveform, slices and `TrimEditor`. Those views need a loading state while a break's audio is fetched.
  - `getBestLayerPitch` and `getBestLayerVolume` look a break up in `LoadedFiles` and read its samples today. They change to take an index entry: slices, sample length and RMS.
  - Index slices are overlaid with the project's `sliceEdits` (factory breaks) or `userBreaks` slices (imported breaks) before use, so the pitch suggestion reflects the user's edits.
  - RMS is measured on the normalised audio, the same as `LowestRMS` in `App.tsx`.
  - The randomiser picks from the factory breaks plus this project's imported breaks, the same as the web app. When a break is imported, C++ adds an index entry for it, and the UI includes the project's `userBreaks` entries alongside the factory ones.
- **Tempo for suggestions:** `getBestLayerPitch` reads the BPM slider. While the DAW plays, the processor pushes the host tempo to the UI, and the suggestion uses that, so randomising during playback picks pitches for the real tempo.

## Automation

DAW parameters are fixed when the plugin is created, but layers are a list that grows and shrinks. So the plugin has **8 layer slots**, and adding more layers than that isn't allowed in the plugin.

- **Per slot:** volume and pitch, named "Layer 1 Volume", "Layer 1 Pitch", and so on.
  - Volume is 0–100, applied as `volume / 100`, the same as the web app. `getBestLayerVolume` (`100 × LowestRMS / rms`, with `LowestRMS` from the factory breaks) can suggest more than 100 for a quiet imported break. The suggestion is clamped to 100, so such a break plays at full layer volume.
  - Pitch is whole semitones from −12 to +12 (`minPitch`/`maxPitch`). It's read when a note starts, so pitch automation affects new notes only, as in the web app. Volume moves smoothly over notes already sounding.
- **Global:** saturation, swing, note length, note fade-out.
- **The parameters are the truth** for every value they cover, both per-slot and global. The UI and the randomiser change those values by setting the parameters, so DAW automation and undo see every change.
  - On `setStateInformation`, saved parameter values set the layers' volume and pitch, and the global settings. The matching fields inside `arrangement` (layer volume/pitch, `saturation`, `swing`, `noteLength`, `noteFadeOut`) are ignored there and only kept for the web app's format.
  - Every change from the UI or randomiser is wrapped in `beginChangeGesture`/`endChangeGesture`: one gesture per slider drag, one per randomise. Without gestures, hosts record an undo step for every tick of a drag and can't record automation properly. Slider values reach the store through `useDebouncedLocalState`, so the gesture has to begin and end on the slider's pointer down and up, not on value updates.
- **Previews sit outside the slots.** Neither kind of Library preview touches a slot's parameters, so previews never land in the DAW's undo history or automation:
  - **Adding a break:** previewing a new break adds a temporary layer (`previewInArrangement`, cleaned up by `useCleanupTempLayer`). It lives only in the processor's state, so it works even when all 8 slots are used. Keeping it takes a free slot; with all 8 used, "keep" is disabled.
  - **"R" replace:** today `replaceInArrangement` writes the candidate straight into the target layer, with its suggested volume and pitch, and keeps the original in `ReplaceOriginalLayer`. In the plugin the candidate is an overlay on that slot, held in the processor's state, and the slot's parameters keep the original's values. Only when the user keeps the candidate are the slot's parameters written, as one gesture.
- Automation follows the slot, not the break. Randomising or swapping a layer's break keeps its automation, which then applies to the new break. Removing a layer removes just that one, by position, as the web app now does. Removing it shifts the layers after it down one slot. The processor copies each later slot's volume and pitch values into the slot below, telling the host about each change, so the shifted layers keep their sound. Their automation lanes stay with the slot numbers. The UI warns about this when you remove a layer that has automation.
- Parameter values live in the processor's state like everything else, and changes from automation are pushed to the UI.

## Testing

- **Scheduling parity (exact):** shared JSON fixtures of state + loaded slices run through `getScheduledNotes` in Vitest and through the C++ port in the headless CLI. The note lists must match: which slices play, when, rate, fades and cutoffs. The output also includes each note's derived fade start and stop times from the `fireNote` rule, which `getScheduledNotes` doesn't produce on its own; otherwise only the loose audio test would catch a mismatch there. Include fixtures with duplicate stepNums (PH Break, and auto-slice output, which can also produce a slice at stepNum 16).
- **State migration:** old-version state fixtures run through the C++ migration and must come out equal to the current-version fixture.
- **Audio parity (loose):** render a few arrangements through `offlineRender` and the C++ engine at pitch 0 and 44.1 kHz, and compare RMS and spectrum, not samples. Chrome's resampler and 4x shaper filter differently from ours, so an exact comparison would only produce noise.
- **Unit:** `arrangementToMidi` round-trip test in Vitest. Parse the bytes back and compare the notes.
- **Host validation in CI:** pluginval (VST3/AU), `auval` (macOS), clap-validator.
- **Manual host matrix:** Logic (AU), Ableton Live, FL Studio, Reaper, Bitwig, on macOS and Windows.

## Phases

1. **Proof of concept.** JUCE `WebViewPluginDemo` with the plugin-mode Vite build inside. Load it in every host in the matrix, including WebView2 on Windows; check Retina/DPI scaling and keyboard focus. Serve `/library/` from disk, and check that reading the system-wide library folder and writing the per-user `User` folder both work from Logic's AU host, which can run plugins out of process. Close and reopen the plugin window and save/reload the project, and check the state comes back. Check that the audition play button makes sound while the DAW is stopped in each host, including Logic, which only keeps processing a stopped instrument on a selected or record-armed track. Drag a hard-coded `.mid` from the native strip into each DAW. Check that each host reports `isNonRealtime()` for every kind of offline render, including bounce, freeze and export; any path that doesn't needs another way to wait for breaks to load. Do a signing/notarization test run.
2. **MIDI mode.** Break loading and normalisation, shared break memory, voice pool, resampling, note mapping, note-length rules, layer gains, processor-owned state and the bridge. The 8 layer slots are created as host parameters here, holding volume and pitch from the start, so the save format and bridge don't change when automation is exposed in phase 5. Slice and trim previews, which the Library editor needs after every slice edit. Slice edits are sent to C++ so MIDI mode plays them straight away; saving them in the project comes in phase 5. The break index and the on-demand loading refactor (`LoadedFiles`/`SelectedFileIndex` across 26 files) belong here too, because the plugin UI needs them to load any break at all. Scheduling parity harness set up. The play button is disabled until phase 3, because auditioning the arrangement needs the scheduling port.
3. **Sequencer mode.** `getScheduledNotes` port, transport sync, swing, playhead back to the UI, the audition play button.
4. **Drag-out.** `arrangementToMidi` + the drag strip wired to the real arrangement, plus save-as fallback.
5. **Saturation and polish.** Oversampled waveshaper, imported breaks and saved slice edits, clearer labels/tooltips for Fill Gaps and Shorten Notes, exposing the parameters to DAW automation (see Automation above).
6. **Release.** Signed installers (macOS pkg, Windows installer), validators green, VST3 + AU + CLAP.
