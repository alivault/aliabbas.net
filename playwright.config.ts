import { readFileSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * The public Convex URLs from .env.production. A clean checkout (CI) has no
 * .env.local, and dev mode does not read .env.production. Not the Turnstile
 * site key: the tests use the test key from .env.development, which passes.
 */
const publicEnv = Object.fromEntries(
  readFileSync('.env.production', 'utf8')
    .split('\n')
    .map((line) => line.match(/^(VITE_CONVEX_[A-Z_]+)=(.*)$/))
    .filter((match) => match !== null)
    .map(([, key, value]) => [key, process.env[key] ?? value]),
)

const PORT = 3000
const executablePath = process.env.CHROMIUM_PATH
/**
 * GPU=1: draw WebGL on the GPU (the self-hosted runner, a Mac with Asahi
 * Linux), not in software. Headless Chromium needs ANGLE on EGL for that.
 */
const gpu = process.env.GPU === '1'
const launchArgs = gpu ? ['--use-angle=gl-egl'] : []
/**
 * CI tests the production build in dist (`E2E=1 vp build` first), as it
 * ships. Locally the tests use the dev server.
 */
const server = process.env.CI ? 'preview' : 'dev'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // One worker for each of the 4 vCPUs of a CI runner.
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: { executablePath, args: launchArgs },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      // Only the tests whose result depends on a phone layout. The other
      // tests check the same logic on desktop.
      name: 'mobile',
      grep: /@mobile/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    // E2E=1 turns off remote Cloudflare bindings. The tests mock the AI.
    command: `vp ${server} --port ${PORT} --strictPort`,
    env: { ...publicEnv, E2E: '1' },
    url: `http://localhost:${PORT}/lab`,
    reuseExistingServer: !process.env.CI,
    // The first start in CI optimizes dependencies from a cold cache.
    timeout: 240_000,
  },
})
