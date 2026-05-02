import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/TheSnakeProject/',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    passWithNoTests: true,
  },
});
