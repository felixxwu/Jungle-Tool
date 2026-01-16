import { debounce } from '../lib/debounce'
import { Player, Playing } from '../lib/store'
import { playArrangement } from './playArrangement'

export const restartPlayback = debounce(() => {
  if (Playing.ref() && Player.ref()?.state === 'started') playArrangement()
}, 200)
