import { probabilities } from '../lib/probabilities'
import { Arrangement, SelectedBar } from '../lib/store'

// expected loop structure: k... s... ..k. s...
const closestKick = [0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 10, 10, 10, 10, 10, 10]
const closestSnare = [4, 4, 4, 4, 4, 4, 4, 4, 12, 12, 12, 12, 12, 12, 12, 12]
const closestHat = [2, 1, 2, 3, 6, 5, 6, 7, 8, 9, 8, 11, 14, 13, 14, 15]

const chooseHit = (kickProb: number, snareProb: number): 'kick' | 'snare' | 'hat' => {
  const random = Math.random()

  if (random < kickProb) {
    return 'kick'
  } else if (random < kickProb + snareProb) {
    return 'snare'
  } else {
    return 'hat'
  }
}

export const randomiseArrangement = () => {
  const newArrangement: number[] = []
  for (let i = 0; i < 16; i++) {
    const probability = probabilities[i]
    const chosenHit = chooseHit(probability.kick, probability.snare)
    if (chosenHit === 'kick') {
      newArrangement.push(closestKick[i])
    } else if (chosenHit === 'snare') {
      newArrangement.push(closestSnare[i])
    } else {
      newArrangement.push(closestHat[i])
    }
  }
  const arrangement = [...Arrangement.ref()].filter(
    n => n.startStep < SelectedBar.ref() * 16 || n.startStep >= (SelectedBar.ref() + 1) * 16
  )

  Arrangement.set([
    ...arrangement,
    ...newArrangement.map((step, i) => ({
      startStep: i + SelectedBar.ref() * 16,
      stepNumToPlay: step,
    })),
  ])
}
