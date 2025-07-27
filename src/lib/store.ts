import { singletonState } from 'singleton-state-hook'
import type { Tone } from './tone'
import type { Layer, LoadedFile, Note } from './types'

export const WindowSize = singletonState({ width: window.innerWidth, height: window.innerHeight })
export const Tab = singletonState<'arrangement' | 'library'>('arrangement')
export const ArrangementSidebarOpen = singletonState(false)
export const BPM = singletonState(160)
export const Player = singletonState<Tone.Player | null>(null)
export const LoadedFiles = singletonState<LoadedFile[]>([])
export const SelectedFileIndex = singletonState<number | null>(null)
export const SelectedSliceIndex = singletonState<number | null>(null)
export const HoveredSliceIndex = singletonState<number | null>(null)
export const EditSliceMode = singletonState(false)
export const AutoSliceMode = singletonState(false)
export const AutoSliceSensitivity = singletonState(2000)
export const Modal = singletonState<React.ReactNode | null>(null)
export const Layers = singletonState<Layer[]>([
  { filename: 'Think (About It)', volume: 0.9, pitch: 5 },
])
export const Arrangement = singletonState<Note[]>([
  { stepNumToPlay: 0, startStep: 0 },
  { stepNumToPlay: 1, startStep: 1 },
  { stepNumToPlay: 2, startStep: 2 },
  { stepNumToPlay: 3, startStep: 3 },
  { stepNumToPlay: 4, startStep: 4 },
  { stepNumToPlay: 5, startStep: 5 },
  { stepNumToPlay: 6, startStep: 6 },
  { stepNumToPlay: 7, startStep: 7 },
  { stepNumToPlay: 8, startStep: 8 },
  { stepNumToPlay: 9, startStep: 9 },
  { stepNumToPlay: 10, startStep: 10 },
  { stepNumToPlay: 11, startStep: 11 },
  { stepNumToPlay: 12, startStep: 12 },
  { stepNumToPlay: 13, startStep: 13 },
  { stepNumToPlay: 14, startStep: 14 },
  { stepNumToPlay: 15, startStep: 15 },
])
export const Playing = singletonState(false)
