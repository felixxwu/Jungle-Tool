import { useEffect, useRef, useState } from 'react'
import { debounce } from '../lib/debounce'

export const useDebouncedLocalState = <T>(
  value: T,
  onChange: (value: T) => void,
  delay: number = 100
) => {
  const [localValue, setLocalValue] = useState(value)
  const debouncedOnChange = useRef(debounce(onChange, delay))

  // debounce the onChange function to avoid too many re-renders
  useEffect(() => {
    debouncedOnChange.current(localValue)
  }, [localValue])

  // keep the local value in sync with the value from the parent
  useEffect(() => {
    if (JSON.stringify(localValue) !== JSON.stringify(value)) {
      setLocalValue(value)
    }
  }, [value])

  // return the local values so that the component that uses them can update
  return [localValue, setLocalValue] as const
}
