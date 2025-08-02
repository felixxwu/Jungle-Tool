import type { ZeroCrossingSearch } from '../lib/types'

export const findClosestZeroCrossing = (
  samples: Float32Array,
  start: number,
  zeroCrossingSearch: ZeroCrossingSearch = 'bidirectional'
) => {
  const forwardCrossing = (() => {
    for (let i = start; i < samples.length; i++) {
      if ((samples[i] > 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] > 0)) {
        return i
      }
    }
    return start
  })()

  const backwardCrossing = (() => {
    for (let i = start; i >= 0; i--) {
      if ((samples[i] > 0 && samples[i + 1] < 0) || (samples[i] < 0 && samples[i + 1] > 0)) {
        return i
      }
    }
    return start
  })()

  if (zeroCrossingSearch === 'forward') {
    return forwardCrossing
  } else if (zeroCrossingSearch === 'backward') {
    return backwardCrossing
  } else {
    const forwardDistance = Math.abs(forwardCrossing - start)
    const backwardDistance = Math.abs(backwardCrossing - start)
    return forwardDistance <= backwardDistance ? forwardCrossing : backwardCrossing
  }
}
