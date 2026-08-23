import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Separate config for the Firestore emulator-backed rules tests. Kept apart
 * from vitest.config.mts, which deliberately excludes *.emulator.test.ts so
 * the default `npm test` run never depends on an external emulator process.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src')
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.emulator.test.ts'],
    testTimeout: 20000
  }
});
