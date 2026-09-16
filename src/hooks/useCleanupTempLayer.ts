import { useEffect } from 'react'
import { Layers, Tab } from '../lib/store'

/**
 * A break previewed from the library while playing is hot-added as a temp
 * layer. If the user leaves the library without confirming it via "Add
 * Layer", drop it rather than leaving it in the arrangement permanently.
 */
export const useCleanupTempLayer = () => {
  const tab = Tab.useState()

  useEffect(() => {
    if (tab === 'library') return
    const layers = Layers.ref()
    if (layers.some(l => l.temp)) {
      Layers.set(layers.filter(l => !l.temp))
    }
  }, [tab])
}
