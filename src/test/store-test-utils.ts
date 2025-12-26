/**
 * Utilities for testing singleton state
 * These helpers make it easier to test state changes in actions
 */

import type { singletonState } from 'singleton-state-hook'

/**
 * Resets a singleton state to its initial value
 */
export const resetState = <T>(state: ReturnType<typeof singletonState<T>>, initialValue: T) => {
  state.set(initialValue)
}

/**
 * Gets the current value of a singleton state
 */
export const getState = <T>(state: ReturnType<typeof singletonState<T>>): T => {
  return state.ref()
}

/**
 * Sets a singleton state and returns the new value
 */
export const setState = <T>(state: ReturnType<typeof singletonState<T>>, value: T): T => {
  state.set(value)
  return state.ref()
}

/**
 * Gets the current value of a state for use in expect() calls
 * Usage: expect(getState(Playing)).toBe(true)
 */
export const getStateForAssertion = <T>(state: ReturnType<typeof singletonState<T>>): T => {
  return state.ref()
}
