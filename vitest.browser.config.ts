/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import type { UserConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['src/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
  },
} as UserConfig)
