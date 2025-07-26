import { singletonState } from 'singleton-state-hook'
import type { Tone } from './tone'
import type { LoadedFile } from './types'

export const WindowSize = singletonState({ width: window.innerWidth, height: window.innerHeight })
export const Tab = singletonState<'arrangement' | 'library'>('library')
export const BPM = singletonState(170)
export const Pitch = singletonState(0)
export const Player = singletonState<Tone.Player | null>(null)
export const LoadedFiles = singletonState<LoadedFile[]>([])
export const SelectedFileIndex = singletonState<number | null>(null)
export const SelectedSliceIndex = singletonState<number | null>(null)
export const EditSliceMode = singletonState(false)
export const AutoSliceMode = singletonState(false)
export const AutoSliceSensitivity = singletonState(2000)
export const Modal = singletonState<React.ReactNode | null>(null)
