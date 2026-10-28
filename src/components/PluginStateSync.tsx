import { useEffect, useRef, useState } from 'react'
import { applyArrangementState, getCurrentArrangementState } from '../actions/arrangementState'
import { callNative, listenToTransport, onPluginEvent } from '../lib/plugin'
import { arrangementToMidi } from '../helpers/arrangementToMidi'
import { layersWithParameters, parametersFromState } from '../helpers/pluginParameters'
import {
  Arrangement,
  BPM,
  FillGaps,
  Layers,
  LoadedFiles,
  NoteFadeOut,
  NoteLength,
  NumBars,
  PluginMode,
  ReplaceLayerIndex,
  ReplaceOriginalLayer,
  Saturation,
  ShortenNotes,
  Swing,
} from '../lib/store'
import type { Slice } from '../lib/types'
import { loadJson } from '../actions/loadJson'

const currentParameters = () => {
  const index = ReplaceLayerIndex.ref()
  const original = ReplaceOriginalLayer.ref()
  return parametersFromState(
    Layers.ref(),
    index !== null && original ? { index, original } : null,
    {
      saturation: Saturation.ref(),
      swing: Swing.ref(),
      noteLength: NoteLength.ref(),
      noteFadeOut: NoteFadeOut.ref(),
    }
  )
}

const applyParameters = (values: Record<string, number>) => {
  const layers = Layers.ref()
  const next = layersWithParameters(layers, values, ReplaceLayerIndex.ref())
  if (next.some((layer, i) => layer !== layers[i])) Layers.set(next)
  for (const [store, key] of [
    [Saturation, 'saturation'],
    [Swing, 'swing'],
    [NoteLength, 'noteLength'],
    [NoteFadeOut, 'noteFadeOut'],
  ] as const) {
    if (store.ref() !== values[key]) store.set(values[key])
  }
}

// Imported breaks are saved in the project; the plugin serves each one's file to the page.
const loadProjectBreaks = async (projectBreaks: { id: string; name: string }[]) => {
  for (const { id, name } of projectBreaks) {
    const response = await fetch(`/project/${encodeURIComponent(id)}.json`)
    if (response.ok) loadJson(await response.text(), name)
  }
}

// The plugin keeps the saved state, because this web view is destroyed whenever its window closes.
// Its DAW parameters are the truth for layer volume and pitch and the global sliders.
export const PluginStateSync = () => {
  const [loaded, setLoaded] = useState(false)
  const sentSlices = useRef<{ [breakName: string]: string }>({})
  const pendingSliceEdits = useRef<{ [breakName: string]: Slice[] }>({})
  const knownParameters = useRef<Record<string, number>>({})
  const layers = Layers.useState()
  const loadedFiles = LoadedFiles.useState()
  const mode = PluginMode.useState()
  const arrangement = Arrangement.useState()
  const numBars = NumBars.useState()
  const swing = Swing.useState()
  const saturation = Saturation.useState()
  const noteLength = NoteLength.useState()
  const noteFadeOut = NoteFadeOut.useState()
  const replaceIndex = ReplaceLayerIndex.useState()
  const replaceOriginal = ReplaceOriginalLayer.useState()
  const values = [
    arrangement,
    BPM.useState(),
    FillGaps.useState(),
    layers,
    noteFadeOut,
    noteLength,
    numBars,
    saturation,
    ShortenNotes.useState(),
    swing,
    mode,
    replaceIndex,
    replaceOriginal,
  ]

  useEffect(() => {
    listenToTransport()
    onPluginEvent<Record<string, number>>('parameters', next => {
      knownParameters.current = next
      applyParameters(next)
    })
    callNative<string>('getState').then(saved => {
      const state = saved ? JSON.parse(saved) : {}
      if (state.arrangement) applyArrangementState(state.arrangement)
      PluginMode.set(state.mode ?? 'midi')
      pendingSliceEdits.current = state.sliceEdits ?? {}
      loadProjectBreaks(state.projectBreaks ?? [])
      // A new instance hasn't heard the UI's defaults yet, so they're all sent as changes.
      knownParameters.current = state.arrangement ? currentParameters() : {}
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    const layersToSend = layers.map((layer, i) =>
      i === replaceIndex && replaceOriginal ? { ...layer, replacing: replaceOriginal } : layer
    )
    callNative(
      'setState',
      JSON.stringify({
        version: 1,
        mode,
        arrangement: { ...getCurrentArrangementState(), layers: layersToSend },
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, ...values])

  // UI edits reach the plugin as parameter changes, so the DAW records them for undo and automation.
  useEffect(() => {
    if (!loaded) return
    const changes = Object.entries(currentParameters()).filter(
      ([id, value]) => knownParameters.current[id] !== value
    )
    if (!changes.length) return
    for (const [id, value] of changes) knownParameters.current[id] = value
    callNative('setParameters', changes)
  }, [loaded, layers, replaceIndex, replaceOriginal, saturation, swing, noteLength, noteFadeOut])

  // The project's slice edits go back onto each break as it loads, and new edits go to the plugin.
  useEffect(() => {
    if (!loaded) return
    let applied = false
    for (const file of loadedFiles) {
      const edits = pendingSliceEdits.current[file.name]
      if (edits) {
        file.slices = edits
        delete pendingSliceEdits.current[file.name]
        applied = true
      }
      const slices = JSON.stringify(file.slices)
      if (sentSlices.current[file.name] === slices) continue
      sentSlices.current[file.name] = slices
      callNative('setSlices', file.name, file.slices)
    }
    if (applied) LoadedFiles.set([...loadedFiles])
  }, [loaded, loadedFiles])

  // Kept up to date so the clip is ready the moment the user drags it out.
  useEffect(() => {
    const name = layers.map(l => l.filename.replace(/\.(wav|json)$/i, '')).join(', ')
    const bytes = arrangementToMidi(arrangement, numBars, swing)
    callNative('setMidiClip', `${name} (Jungle Tool).mid`, Array.from(bytes))
  }, [arrangement, numBars, swing, layers])

  return null
}
