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
