import { readFileSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * The public Convex URLs from .env.production. A clean checkout (CI) has no
 * .env.local, and dev mode does not read .env.production.
 */
const publicEnv = Object.fromEntries(
  readFileSync('.env.production', 'utf8')
    .split('\n')
    .map((line) => line.match(/^(VITE_[A-Z_]+)=(.*)$/))
    .filter((match) => match !== null)
    .map(([, key, value]) => [key, process.env[key] ?? value]),
)

const PORT = 3100
const executablePath = process.env.CHROMIUM_PATH

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
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
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    // E2E=1 turns off remote Cloudflare bindings. The tests mock the AI.
    command: `vp dev --port ${PORT} --strictPort`,
    env: { ...publicEnv, E2E: '1' },
    url: `http://localhost:${PORT}/lab`,
    reuseExistingServer: !process.env.CI,
    // The first start in CI optimizes dependencies from a cold cache.
    timeout: 240_000,
  },
})
