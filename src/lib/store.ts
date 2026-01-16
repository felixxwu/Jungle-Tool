import { singletonState } from 'singleton-state-hook'
import type { Tone } from './tone'
import type { ITab, Layer, LoadedFile, Note } from './types'
import { maxNoteLength, minNoteFadeOut } from './consts'

export const WindowSize = singletonState({ width: window.innerWidth, height: window.innerHeight })
export const Tab = singletonState<ITab>('arrangement')
export const BPM = singletonState(160)
export const Swing = singletonState(17)
export const NoteLength = singletonState(maxNoteLength)
export const NoteFadeOut = singletonState(minNoteFadeOut)
export const Saturation = singletonState(50)
export const Player = singletonState<Tone.Player | null>(null)
export const LibraryLoading = singletonState(true)
export const LoadedFiles = singletonState<LoadedFile[]>([])
export const LowestRMS = singletonState<number>(Infinity)
export const SelectedFileIndex = singletonState<number | null>(null)
export const SelectedSliceIndex = singletonState<number | null>(null)
export const HoveredSliceIndex = singletonState<number | null>(null)
export const EditSliceMode = singletonState(false)
export const AutoSliceMode = singletonState(false)
export const AutoSliceSensitivity = singletonState(2000)
export const Modal = singletonState<React.ReactNode | null>(null)
export const AddLayerMode = singletonState(false)
export const Layers = singletonState<Layer[]>([
  { filename: 'Think (About It) (1)', volume: 50, pitch: 3 },
  { filename: 'Mr. Sandman', volume: 100, pitch: 7 },
])
export const SelectedLayerName = singletonState<string | null>(null)
export const SelectedBar = singletonState(0)
export const NumBars = singletonState(1)
export const Arrangement = singletonState<Note[]>(
  Array.from({ length: 16 }, (_, i) => ({
    stepNumToPlay: i,
    startStep: i,
  }))
)
export const Playing = singletonState(false)
export const PlayStartTimestamp = singletonState<number | null>(null)
export const PlayDuration = singletonState<number | null>(null) // Duration in seconds
export const FillGaps = singletonState(true)
export const ShortenNotes = singletonState(false)
