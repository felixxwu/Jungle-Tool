# Testing Setup Complete! 🎉

Your automated frontend testing infrastructure is now configured. Follow these steps to get started:

## Step 1: Install Dependencies

```bash
npm install
```

This will install:

- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for tests
- `@vitest/coverage-v8` - Code coverage reporting
- `@vitest/ui` - Visual test UI

## Step 2: Run Your First Test

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run tests once (for CI/CD)
npm run test:run

# Run tests with visual UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## What's Been Set Up

### ✅ Configuration Files

- **`vite.config.ts`** - Vitest configuration integrated with Vite
- **`src/test/setup.ts`** - Global test setup (mocks, cleanup)
- **`src/test/test-utils.tsx`** - Custom render utilities for React components

### ✅ Example Tests Created

- **`src/helpers/getStepSize.test.ts`** - Utility function tests
- **`src/lib/playback.test.ts`** - Playback utility tests
- **`src/lib/consts.test.ts`** - Constants validation tests
- **`src/components/Text.test.tsx`** - Component tests

### ✅ Test Scripts Added

- `npm test` - Watch mode
- `npm run test:run` - Single run
- `npm run test:ui` - Visual UI
- `npm run test:coverage` - Coverage report

## Writing New Tests

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Place test files next to the code they test, or in a `__tests__` folder

### Example Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(input)).toBe(expected)
  })
})
```

### Component Testing

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

## Features

- **Fast**: Vitest uses Vite's fast HMR
- **TypeScript**: Full TypeScript support
- **Coverage**: Built-in code coverage reporting
- **UI**: Visual test runner available
- **Mocking**: Tone.js and browser APIs pre-mocked
- **React Testing**: Full React Testing Library support

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm test` to see the example tests pass
3. Start writing tests for your components and utilities!
4. Add tests to your CI/CD pipeline with `npm run test:run`

For more details, see `src/test/README.md`
