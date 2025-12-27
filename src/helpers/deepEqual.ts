/**
 * Deep equality check for primitive values, arrays, and plain objects.
 * Uses reference equality for non-plain objects (functions, class instances, etc.)
 */
export const isDeepEqual = <T>(a: T, b: T): boolean => {
  // Reference equality for primitives and same reference
  if (a === b) return true

  // Handle null/undefined
  if (a == null || b == null) return a === b

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, idx) => isDeepEqual(val, b[idx]))
  }

  // Handle plain objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every(key => isDeepEqual((a as any)[key], (b as any)[key]))
  }

  // For other types (functions, class instances), use reference equality
  return false
}

