import type { ReactElement } from 'react'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'

/**
 * Custom render function that includes any providers or global setup
 * Use this instead of the default render from @testing-library/react
 */
const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return rtlRender(ui, {
    ...options,
  })
}

// Re-export everything except render
export {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react'
export type { RenderOptions, RenderResult } from '@testing-library/react'
export { render }
