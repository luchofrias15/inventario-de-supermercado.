import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'coverage/**'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
