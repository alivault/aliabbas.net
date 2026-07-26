import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, lazyPlugins } from 'vite-plus'

export default defineConfig({
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    importOrder: [
      '^(react/(.*)$)|^(react$)',
      '^~/(.*)$',
      '<THIRD_PARTY_MODULES>',
    ],
    printWidth: 80,
    sortPackageJson: true,
    sortTailwindcss: {},
    ignorePatterns: ['convex/_generated/**', 'convex/README.md'],
  },
  server: {
    port: 3000,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'motion-vendor',
              test: /node_modules[\\/](?:\.pnpm[\\/])?(?:motion|motion-dom|motion-utils)(?:@|[\\/])/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    noExternal: ['@convex-dev/better-auth'],
  },
  plugins: lazyPlugins(() => [
    devtools({ injectSource: { enabled: true } }),
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    react(),
  ]),
})
