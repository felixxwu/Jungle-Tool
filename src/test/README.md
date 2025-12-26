# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit and integration testing, along with [React Testing Library](https://testing-library.com/react) for component testing.

## Running Tests

```bash
# Run tests in watch mode (default)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- **Unit Tests**: Test individual functions and utilities (e.g., `getStepSize.test.ts`)
- **Component Tests**: Test React components (e.g., `Text.test.tsx`)
- **Integration Tests**: Test multiple components working together

## Writing Tests

### Example: Testing a Utility Function

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expectedOutput)
  })
})
```

### Example: Testing a Component

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Test Utilities

Use `render` from `src/test/test-utils.tsx` instead of the default from `@testing-library/react`. This ensures consistent setup across all tests.

## Mocking

- Tone.js is automatically mocked in `src/test/setup.ts` to avoid audio context issues
- Window APIs (matchMedia, URL methods) are also mocked
- Use `vi.mock()` for additional mocks as needed

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.
