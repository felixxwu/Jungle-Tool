import type { File } from './types'

export const lineThickness = 1
export const minBPM = 100
export const maxBPM = 200
export const minPitch = -12
export const maxPitch = 12
export const appWidth = 1200
export const appHeight = 600
export const librarySidebarWidth = 300
export const smallSliceAdjustment = 75
export const largeSliceAdjustment = 1000
export const zoomInFactor = 7
export const waveformHeight = 200

export const library: File[] = [
  {
    path: 'think about it',
    name: 'Think (About It)',
    artist: 'Lyn Collins',
    year: 1972,
  },
  {
    path: 'funky drummer',
    name: 'Funky Drummer',
    artist: 'James Brown',
    year: 1986,
  },
]
