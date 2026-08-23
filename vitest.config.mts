import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src')
    }
  },
  // tsconfig.json sets "jsx": "preserve" for the Next.js compiler, which the
  // test transformer cannot parse. Override it here so tests may import
  // constants that live alongside components in .tsx files (e.g. BED_SIDE_TASKS).
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Excluded from the default run: needs the Firebase emulator suite
    // running externally. Run explicitly via `npm run test:rules`.
    exclude: ['**/node_modules/**', '**/*.emulator.test.ts']
  }
});
