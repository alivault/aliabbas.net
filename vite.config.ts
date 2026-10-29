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
    // A dependency that imports tailwind-merge uses cn too, so the bundle
    // has one merge engine. clsx is not aliased: TanStack Devtools uses its
    // default export, which cn does not provide.
    alias: { 'tailwind-merge': 'cn' },
  },
  ssr: {
    noExternal: ['@convex-dev/better-auth'],
  },
  test: {
    // Unit tests only. Playwright runs the end-to-end tests in e2e/.
    include: ['src/**/*.test.ts'],
    // The design tokens read globals.css as text.
    css: { include: [/globals\.css/] },
  },
  plugins: lazyPlugins(() =>
    // Unit tests test plain modules: they need no Worker and no router.
    process.env.VITEST
      ? []
      : [
          devtools({ injectSource: { enabled: true } }),
          tailwindcss(),
          cloudflare({
            viteEnvironment: { name: 'ssr' },
            // End-to-end tests mock the AI routes, so they need no Cloudflare login.
            remoteBindings: process.env.E2E !== '1',
          }),
          tanstackStart(),
          react(),
        ],
  ),
})
