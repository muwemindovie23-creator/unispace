import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias from tsconfig.json natively.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // scrypt is intentionally slow; the default 5s is tight on a cold run.
    testTimeout: 20000,
  },
})
