const songs: string[] = [
  'k... s.k. ..s. k...', // samurai breaks - bandits
  'k... k... s.k. ..s.',
  'k... s.k. ..s. ....', // sl8r - vantage point
  '.... s.k. ..s. ....',
  's... k.s. ..k. ....',
  'k... s... ..s. s...', // central line - arcane remix
  'k... s... ..k. s...',
  'k... s.k. ..s. ....', // living real dead man's chest
  'k... s... ..s. ....', // cut-throat hardcore dead man's chest
  'k... s.s. k... k...',
  'k.k. s... ..k. ..s.', // flow eusebeia
  'k.k. s... ..k. s...',
  'k.k. s.k. k.s. ....',
  'k... s... ..s. ..s.', // till dawn janaway
  'k.k. s... ..s. s.s.',
  'k.k. s... ..k. s...', // zeus - threshold remix
  'k... s.k. ..s. k.s.', // tara lily double time
  'k... s... ..k. s...', // going gets tuff lemon d
  'k... s... ..k. s...', // curse of the pharaohs arcane
  'k... ss.s .sk. s...',
  'k... s.k. ..s. ....',
  'k... s... ..s. ..s.', // sals groove adam hare remix
  'k.ss ..k. ss.. k.s.', // love somebody else lavery
  'k... s.k. ..s. k.s.',
  'k... s... ..s. s.s.',
  'k... k... s.k. ..s.',
  'k... s.k. ..s. k...',
  'k... s... ..s. ....',
  'k.k. s... ..s. ....',
  'k... k... k.k. ..s.', // blossom dub phizix
  '..k. s... k.s. k.k.',
  '..k. s... k.s. ..k.',
  'k... s.k. ..s. ..s.', // how it flows tommy the cat
  '.... s... ..s. ....',
  'k... k... s.k. ..s.',
  '..s. .... s.s. s...',
  'k... s.k. ..s. s.s.',
  'k... s... ..k. s...',
  'k... s... ..k. ..s.',
  'k... s.k. .... s...',
  'k... s... ..s. ....',
  'k... s.k. k... s...',
  'k... s... k... s...',
  'k... s... s... ....',
  'k... k.k. ..s. ....',
  'k... s... k.s. s...', // demuja good only days
  'k.k. s... ..s. ....', // different vibrations kloke
  'k... s.k. ..s. ....',
  'k.k. s... ..k. k.s.',
  'k... s... ..k. s...', // suspended space ltj bukem
  'k... s... ..k. s...', // alex reece pulp fiction
  'k... s... k.s. ....', // ltj bukem logical progression (alternate mix)
  'k... s... k.s. k.k.',
  'k... s.k. k... s...', // nectax game theory
  'k... s.k. ..s. ....',
  'k.k. s... s.s. ..s.', // coco bryce dlp
  'k... s.k. ..s. ..s.', // sully model collapse
  'k... s.k. ..s. ....',
  'k... s.k. k.k. ..s.', // flowrian the way the world is
  'k... s... ..s. ....',
  'k... s.k. ..s. ....', // stones taro mint
  'k... s... s.k. ..s.', // janaway introspect
  '..k. s... k.s. ..k.',
  'k... s... ..s. ....', // spy billy no mates
  'k... s... ..s. ....', // sully flock
  's.s. s... ..s. ..k.',
  'k... s... ..s. ..s.',
  '..s. ..s. ..ss ..ss',
  'k... s... ..s. ....', // izco gifted
  'k... s..s s.k. ..k.', // elysian fields tim reaper
  'k.s. ssk. s.ss ..ss',
  'ssk. s.k. ..s. k...',
  'k... k... s.k. ..s.',
  'k... s.k. ..s. s...', // mystical harmony
  'k... s... s... ..k.', // subjects last tune
  's... k.s. ..k. s...',
  'k... k... s... ..k.',
  'k... s... s... s...', // 20th century jungle high contrast
  'k... s.s. ..k. s...',
  'k... s.s. ..k. s...', // 4am kru good time
  '.... s... ..k. s...',
  'k... k.k. s... ..s.', // planet dust freefall
  '.... s... ..s. ....',
  'k.k. s... ..k. s...', // coco bryce night safari
  'k.k. s... ..k. s...', // calibre mr majestic
  'k.k. s... ..k. ..s.',
  'k... s.k. ..s. ....', // nookie only you
  '.... s.k. k... s...',
  'k... s.k. ..s. ....', // m-beat sweet love
  'k... s.k. k... s...',
  'k... s... ..k. ..s.', // foul play finest illusion
  'k... s.k. ..k. ..s.', // tim reaper phonetics
  'k... s... ..k. s...', // coco bryce trust issues
  'k... s.k. ..s. k.s.', // sully werk
  'k... s.k. ..k. s...', // tim reaper all the time
  'k... s... ..s. ....', // subjects goblin
  'k... s.k. k.s. ....',
  'k... s... ..s. ..s.', // fracture all of the massive
  'k... s... ..k. s...',
  'k... s... ..s. ..s.', // dwarde realisation
  'k... s.k. ..s. s...', // 4am kru what is jungle
  'k... s.k. ..s. ..s.', // dwarde get away
  'k... s.k. ..s. ....', // tmsv abyss watcher
]

for (const song of songs) {
  const bars = song.split(' ')
  if (bars.length !== 4) throw new Error('Song must have 4 bars')

  for (const bar of bars) {
    const notes = bar.split('')
    if (notes.length !== 4) throw new Error(`Bar must have 4 notes. Song: ${song}`)

    for (const note of notes) {
      if (note !== 'k' && note !== 's' && note !== '.')
        throw new Error(`Invalid note. Song: ${song}`)
    }
  }
}

const probabilities: { kick: number; snare: number; hat: number }[] = []

for (let position = 0; position < 16; position++) {
  let kickCount = 0
  let snareCount = 0
  let hatCount = 0
  let totalCount = 0

  for (const song of songs) {
    const bars = song.split(' ')
    const barIndex = Math.floor(position / 4)
    const noteIndex = position % 4

    if (barIndex < bars.length) {
      const bar = bars[barIndex]
      const note = bar[noteIndex]

      if (note === 'k') kickCount++
      else if (note === 's') snareCount++
      else if (note === '.') hatCount++

      totalCount++
    }
  }

  probabilities.push({
    kick: totalCount > 0 ? kickCount / totalCount : 0,
    snare: totalCount > 0 ? snareCount / totalCount : 0,
    hat: totalCount > 0 ? hatCount / totalCount : 0,
  })
}

export { probabilities }
