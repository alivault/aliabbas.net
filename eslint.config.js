import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: ['convex/_generated/**', 'eslint.config.js'],
  },
  ...tanstackConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        React: 'readonly',
      },
    },
    rules: {
      'react/no-unescaped-entities': 0,
    },
  },
  {
    files: ['convex/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
]
