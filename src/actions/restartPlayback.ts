import { debounce } from '../lib/debounce'
import { Player } from '../lib/store'
import { playArrangement } from './playArrangement'

export const restartPlayback = debounce(() => {
  if (Player.ref()?.state === 'started') playArrangement()
}, 200)
