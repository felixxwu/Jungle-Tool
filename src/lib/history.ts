import { applyArrangementState, getCurrentArrangementState } from '../actions/arrangementState'
import { isDeepEqual } from '../helpers/deepEqual'
import { CanRedo, CanUndo, ReplaceLayerIndex } from './store'
import type { ArrangementState } from './types'

// Undo/redo for the arrangement, layers and settings, as snapshots of the arrangement state.
// Preview layers and an unkept replacement aren't part of it.
const limit = 100
let past: ArrangementState[] = []
let future: ArrangementState[] = []
let current: ArrangementState | null = null

const snapshot = (): ArrangementState => {
  const state = getCurrentArrangementState()
  return { ...state, layers: state.layers.filter(layer => !layer.temp) }
}

const publish = () => {
  CanUndo.set(past.length > 0)
  CanRedo.set(future.length > 0)
}

const restore = (state: ArrangementState) => {
  current = state
  applyArrangementState(state)
  publish()
}

export const canUndo = () => past.length > 0
export const canRedo = () => future.length > 0

export const recordHistory = () => {
  if (ReplaceLayerIndex.ref() !== null) return
  const next = snapshot()
  if (current && isDeepEqual(current, next)) return
  if (current) past = [...past, current].slice(-limit)
  current = next
  future = []
  publish()
}

export const undo = () => {
  if (!past.length || !current) return
  future = [current, ...future]
  restore(past[past.length - 1])
  past = past.slice(0, -1)
  publish()
}

export const redo = () => {
  if (!future.length || !current) return
  past = [...past, current]
  restore(future[0])
  future = future.slice(1)
  publish()
}

// Starts a fresh history, from whatever state is recorded next.
export const resetHistory = () => {
  past = []
  future = []
  current = null
  publish()
}
