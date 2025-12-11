import { tanstackConfig } from '@tanstack/eslint-config'

export default [
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
]
