import { useEffect, useRef, useState } from 'react'
import { debounce } from '../lib/debounce'
import { isDeepEqual } from '../helpers/deepEqual'

export const useDebouncedLocalState = <T>(
  value: T,
  onChange: (value: T) => void,
  delay: number = 100
) => {
  const [localValue, setLocalValue] = useState(value)
  const debouncedOnChange = useRef(debounce(onChange, delay))
  const isInitialMount = useRef(true)
  const lastUserValue = useRef<T | null>(null)

  // debounce the onChange function to avoid too many re-renders
  // Skip calling onChange on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Only call onChange if this was a user-initiated change
    if (lastUserValue.current !== null && isDeepEqual(localValue, lastUserValue.current)) {
      debouncedOnChange.current(localValue)
    }
  }, [localValue])

  // keep the local value in sync with the value from the parent
  // Only sync if the local value doesn't match a recent user update
  useEffect(() => {
    if (!isDeepEqual(localValue, value)) {
      // If this value matches what the user last set, don't override it
      if (lastUserValue.current !== null && isDeepEqual(value, lastUserValue.current)) {
        lastUserValue.current = null // Clear the flag after matching
        return
      }
      // Only sync if it's not a user-initiated value
      if (lastUserValue.current === null || !isDeepEqual(localValue, lastUserValue.current)) {
        setLocalValue(value)
        lastUserValue.current = null
      }
    }
  }, [value, localValue])

  // Wrapper for setLocalValue that marks this as a user update
  const setLocalValueWithFlag = (newValue: T) => {
    lastUserValue.current = newValue
    setLocalValue(newValue)
  }

  // return the local values so that the component that uses them can update
  return [localValue, setLocalValueWithFlag] as const
}
