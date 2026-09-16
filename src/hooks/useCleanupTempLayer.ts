import { useEffect } from 'react'
import { Layers, ReplaceLayerIndex, ReplaceOriginalLayer, Tab } from '../lib/store'

/**
 * A break previewed from the library while playing is hot-added as a temp
 * layer, and selecting "R" on a layer opens the library to audition
 * replacements live in that slot. If the user leaves the library without
 * confirming either via "Add Layer" or by re-clicking the previewed
 * replacement, undo the pending change rather than leaving it dangling.
 */
export const useCleanupTempLayer = () => {
  const tab = Tab.useState()

  useEffect(() => {
    if (tab === 'library') return

    const layers = Layers.ref()
    if (layers.some(l => l.temp)) {
      Layers.set(layers.filter(l => !l.temp))
    }

    const replaceIndex = ReplaceLayerIndex.ref()
    if (replaceIndex !== null) {
      const original = ReplaceOriginalLayer.ref()
      const current = Layers.ref()
      if (original && replaceIndex >= 0 && replaceIndex < current.length) {
        const reverted = [...current]
        reverted[replaceIndex] = original
        Layers.set(reverted)
      }
      ReplaceLayerIndex.set(null)
      ReplaceOriginalLayer.set(null)
    }
  }, [tab])
}
