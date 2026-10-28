import { resumeAudioContext } from '../lib/audioContext'
import { startScheduler } from '../lib/scheduler'
import { Playing } from '../lib/store'
import { IS_PLUGIN, callNative } from '../lib/plugin'

export const playArrangement = async () => {
  // The plugin auditions only while the DAW is stopped, and reports back when it's playing.
  if (IS_PLUGIN) return callNative('setAuditioning', true)
  await resumeAudioContext()
  Playing.set(true)
  startScheduler()
}
