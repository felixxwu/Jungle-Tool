import { singletonState } from 'singleton-state-hook'

export const Tab = singletonState<'arrangement' | 'library'>('arrangement')
export const BPM = singletonState<number>(170)
export const Pitch = singletonState<number>(0)
