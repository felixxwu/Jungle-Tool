// Breaks are found by name, so an import gets a name no other break uses.
export const uniqueBreakName = (name: string, taken: string[]) => {
  if (!taken.includes(name)) return name
  let n = 2
  while (taken.includes(`${name} (${n})`)) n++
  return `${name} (${n})`
}
