import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Sonar uyumu: loose equality bug fix'i için --fix otomatik düzeltir
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // console.log debug kalıntıları — error/warn bilinçli, log silinmeli
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Test dosyalarında console mantıklı (vi.spyOn için)
  {
    files: ['**/*.test.{js,jsx}'],
    rules: { 'no-console': 'off' },
  },
])
