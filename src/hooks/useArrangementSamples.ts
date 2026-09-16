import { useEffect, useState } from 'react'
import { mono } from '../lib/audio'
import { audioBufferToSamples, renderOffline } from '../lib/offlineRender'
import { useArrangementStateValues } from './useArrangementStates'

const DEBOUNCE_MS = 150

/**
 * Renders the arrangement offline for drawing. Debounced and asynchronous, so
 * a slow redraw can never stutter or delay playback -- the scheduler owns
 * audio and shares nothing with this path but the planning function.
 */
export const useArrangementSamples = (p: { bar?: number }) => {
  // Subscribe so the hook re-runs on any arrangement-affecting change, and
  // use the values as the effect's dependency key. Without a dependency array
  // the effect would re-run on every render and setSamples would loop forever.
  const values = useArrangementStateValues()
  const [samples, setSamples] = useState<Float32Array | null>(null)
  const key = JSON.stringify({ ...values, bar: p.bar })

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(async () => {
      const buffer = await renderOffline({ bar: p.bar })
      if (!cancelled) setSamples(mono(audioBufferToSamples(buffer)))
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return samples
}
