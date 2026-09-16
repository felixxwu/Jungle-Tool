/**
 * Duration of one 16th-note step in seconds.
 * The seconds-domain sibling of getStepSize, which returns samples.
 */
export const getStepSeconds = (bpm: number): number => {
  return 60 / bpm / 4
}
