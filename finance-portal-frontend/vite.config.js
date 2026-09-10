import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/index.js',
        'src/test/**',
        '**/*.test.{js,jsx}',
        // 3rd-party'i wrap eden i18n + assets coverage'a değer eklemez
        'src/i18n/**',
        'src/assets/**',
      ],
    },
  },
})
