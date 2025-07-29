import { singletonState } from 'singleton-state-hook'
import type { Tone } from './tone'
import type { Layer, LoadedFile, Note } from './types'

export const WindowSize = singletonState({ width: window.innerWidth, height: window.innerHeight })
export const Tab = singletonState<'arrangement' | 'library'>('arrangement')
export const ArrangementSidebarOpen = singletonState(false)
export const BPM = singletonState(160)
export const Swing = singletonState(15)
export const Player = singletonState<Tone.Player | null>(null)
export const LibraryLoading = singletonState(true)
export const LoadedFiles = singletonState<LoadedFile[]>([])
export const SelectedFileIndex = singletonState<number | null>(null)
export const SelectedSliceIndex = singletonState<number | null>(null)
export const HoveredSliceIndex = singletonState<number | null>(null)
export const EditSliceMode = singletonState(false)
export const AutoSliceMode = singletonState(false)
export const AutoSliceSensitivity = singletonState(2000)
export const Modal = singletonState<React.ReactNode | null>(null)
export const Layers = singletonState<Layer[]>([
  { filename: 'Think (About It)', volume: 70, pitch: 5 },
  { filename: 'Mr. Sandman', volume: 100, pitch: 7 },
])
export const SelectedBar = singletonState(0)
export const NumBars = singletonState(1)
export const Arrangement = singletonState<Note[]>(
  Array.from({ length: 16 }, (_, i) => ({
    stepNumToPlay: i,
    startStep: i,
  }))
)
export const Playing = singletonState(false)
