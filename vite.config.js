import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // ── Production build ──────────────────────────────────────────────
  build: {
    outDir: 'dist',
    // Keep source maps for error monitoring (hidden from end users)
    sourcemap: 'hidden',
    // Raise chunk warning limit slightly
    chunkSizeWarningLimit: 600,
  },

  // ── Dev server ────────────────────────────────────────────────────
  server: {
    port: 5173,
    open: true, // auto-open browser on `npm run dev`
    host: true, // expose to local network (useful for mobile testing)
  },

  // ── Preview server (for `npm run preview` after build) ───────────
  preview: {
    port: 4173,
    open: true,
  },

  // ── Test runner ───────────────────────────────────────────────────
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['src/main.jsx', 'src/**/*.test.{js,jsx}', 'src/types/**'],
      thresholds: {
        statements: 78,
        branches: 68,
        functions: 72,
        lines: 80,
      },
    },
  },
});
