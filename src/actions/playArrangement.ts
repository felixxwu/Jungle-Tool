import { resumeAudioContext } from '../lib/audioContext'
import { startScheduler } from '../lib/scheduler'
import { Playing } from '../lib/store'

export const playArrangement = async () => {
  await resumeAudioContext()
  Playing.set(true)
  startScheduler()
}
