/**
 * Renders scripts/og-image.html to public/og-image.png (1200 × 630).
 *
 *   node scripts/og-image.ts
 *
 * Uses the Playwright that the end-to-end tests use. Set CHROMIUM_PATH
 * to use an installed Chromium instead of Playwright's download.
 */
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const html = fileURLToPath(new URL('./og-image.html', import.meta.url))
const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url))

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(`file://${html}`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: out })
await browser.close()
console.log(`Wrote ${out}`)
