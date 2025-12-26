# Testing Singleton State

This guide shows how to test singleton state changes after actions in your application.

## Important Principle

**Don't test direct state manipulation** - Testing that `Playing.set(true)` followed by `expect(Playing.ref()).toBe(true)` is pointless. We're testing that the state library works, which we can assume it does.

**Instead, test functions and actions that cause state changes** - Test the business logic that modifies state, not the state library itself.

## Overview

The app uses `singleton-state-hook` for state management. Each state provides:

- `.ref()` - Get current value
- `.set(value)` - Set new value

## What NOT to Test

❌ **Don't test direct state manipulation:**

```typescript
// BAD - This is pointless
it('can set and get state', () => {
  Playing.set(true)
  expect(Playing.ref()).toBe(true) // We're just testing the library works
})
```

✅ **Do test functions that modify state:**

```typescript
// GOOD - Testing actual business logic
it('stopPlayback clears all playback state', () => {
  Playing.set(true)
  PlayStartTimestamp.set(Date.now())

  stopPlayback() // Function that modifies state

  expect(Playing.ref()).toBe(false) // Verify the function worked
  expect(PlayStartTimestamp.ref()).toBe(null)
})
```

## Testing Actions That Change State

### Example: Testing `stopPlayback()`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { stopPlayback } from '../lib/playback'
import { Player, Playing, PlayStartTimestamp, PlayDuration } from '../lib/store'

describe('stopPlayback', () => {
  beforeEach(() => {
    // Setup initial state
    Playing.set(true)
    PlayStartTimestamp.set(Date.now())
    PlayDuration.set(10)
  })

  it('clears all playback state', () => {
    stopPlayback()

    expect(Playing.ref()).toBe(false)
    expect(PlayStartTimestamp.ref()).toBe(null)
    expect(PlayDuration.ref()).toBe(null)
  })
})
```

### Example: Testing `playFile` Action

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playFile } from '../actions/playFile'
import { LoadedFiles, Player, Playing } from '../lib/store'

// Mock dependencies
vi.mock('../lib/audio')
vi.mock('../lib/playback')

describe('playFile', () => {
  beforeEach(() => {
    // Reset state
    Playing.set(false)
    PlayStartTimestamp.set(null)

    // Setup mock data
    const mockFile = {
      name: 'test',
      samples: [new Float32Array(44100), new Float32Array(44100)],
      // ... other properties
    }
    LoadedFiles.ref = vi.fn(() => [mockFile])
  })

  it('sets Playing to false initially', async () => {
    await playFile(0)
    expect(Playing.ref()).toBe(false) // or check via mock
  })
})
```

## Using Test Utilities

We provide helper utilities in `src/test/store-test-utils.ts`:

```typescript
import { expectState, expectStateNull, setState, getState } from '../test/store-test-utils'
import { Playing, PlayStartTimestamp } from '../lib/store'

describe('Using utilities', () => {
  it('uses helper functions', () => {
    setState(Playing, true)
    expectState(Playing, true)

    setState(PlayStartTimestamp, null)
    expectStateNull(PlayStartTimestamp)
  })
})
```

## Testing State Interactions

### Multiple States Together

```typescript
it('sets multiple related states', () => {
  const timestamp = Date.now()

  Playing.set(true)
  PlayStartTimestamp.set(timestamp)
  PlayDuration.set(10)

  // Verify all states
  expect(Playing.ref()).toBe(true)
  expect(PlayStartTimestamp.ref()).toBe(timestamp)
  expect(PlayDuration.ref()).toBe(10)
})
```

### State Transitions

```typescript
it('handles state transitions correctly', () => {
  // Initial state
  expect(Playing.ref()).toBe(false)

  // Start playing
  Playing.set(true)
  PlayStartTimestamp.set(Date.now())
  expect(Playing.ref()).toBe(true)

  // Stop playing
  Playing.set(false)
  PlayStartTimestamp.set(null)
  expect(Playing.ref()).toBe(false)
  expect(PlayStartTimestamp.ref()).toBe(null)
})
```

## Mocking State for Action Tests

When testing actions that depend on state, you can mock the state:

```typescript
import { vi } from 'vitest'
import { LoadedFiles } from '../lib/store'

// Mock state
vi.mock('../lib/store', async () => {
  const actual = await vi.importActual('../lib/store')
  return {
    ...actual,
    LoadedFiles: {
      ref: vi.fn(() => [mockFile]),
      set: vi.fn(),
    },
  }
})
```

## Best Practices

1. **Reset State in beforeEach**: Always reset state to known values before each test
2. **Test State Changes**: Verify both the initial and final state
3. **Test Edge Cases**: Test with null, empty arrays, boundary values
4. **Isolate Tests**: Each test should be independent
5. **Use Mocks Sparingly**: Only mock when testing actions, not when testing state directly

## Example Test Files

- `src/lib/store.test.ts` - Direct state testing
- `src/lib/playback.test.ts` - Testing functions that modify state
- `src/actions/playFile.test.ts` - Testing actions with mocked dependencies

## Common Patterns

### Pattern 1: Test State After Action

```typescript
it('updates state after action', () => {
  // Setup
  const initialState = Playing.ref()

  // Action
  someAction()

  // Assert
  expect(Playing.ref()).not.toBe(initialState)
})
```

### Pattern 2: Test State Sequence

```typescript
it('follows correct state sequence', () => {
  // Step 1
  Playing.set(true)
  expect(Playing.ref()).toBe(true)

  // Step 2
  PlayStartTimestamp.set(Date.now())
  expect(PlayStartTimestamp.ref()).not.toBe(null)

  // Step 3
  Playing.set(false)
  expect(Playing.ref()).toBe(false)
})
```

### Pattern 3: Test State Clearing

```typescript
it('clears all related states', () => {
  // Setup
  Playing.set(true)
  PlayStartTimestamp.set(Date.now())
  PlayDuration.set(10)

  // Action
  stopPlayback()

  // Assert all cleared
  expect(Playing.ref()).toBe(false)
  expect(PlayStartTimestamp.ref()).toBe(null)
  expect(PlayDuration.ref()).toBe(null)
})
```
