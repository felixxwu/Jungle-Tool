import { singletonState } from 'singleton-state-hook'
import type { Tone } from './tone'
import type { LoadedFile } from './types'

export const Tab = singletonState<'arrangement' | 'library'>('arrangement')
export const BPM = singletonState<number>(170)
export const Pitch = singletonState<number>(0)
export const Player = singletonState<Tone.Player | null>(null)
export const LoadedFiles = singletonState<LoadedFile[]>([])
