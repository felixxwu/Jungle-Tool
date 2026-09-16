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
