import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        'src/main.jsx',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
      ],
      // No thresholds: coverage is still reported but won't fail the run
    },
  },
})
