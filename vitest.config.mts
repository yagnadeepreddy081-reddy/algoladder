import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    // Integration tests share one Postgres database, so they must not race.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
      '~': resolve(root, '.'),
      // `server-only` throws when a bundler resolves its browser entry. Under
      // Vitest we are already in Node, so swap it for a no-op.
      'server-only': resolve(root, 'tests/stubs/server-only.ts'),
    },
  },
});
