/**
 * Renders scripts/og-image.html to public/og-image.png (1200 × 630).
 *
 *   vp dev            (in another terminal)
 *   node scripts/og-image.ts
 *
 * It first draws the world of the running site (OG_WORLD_URL, by default
 * the chat page of the dev server, for its orb) without the HUD and the
 * page, and puts it behind the text. Uses the
 * Playwright that the end-to-end tests use. Set CHROMIUM_PATH to use an
 * installed Chromium instead of Playwright's download.
 */
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const html = fileURLToPath(new URL('./og-image.html', import.meta.url))
const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url))
const world = process.env.OG_WORLD_URL ?? 'http://localhost:3000/ai?gl=force'

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  // Software WebGL, so the world draws without a GPU.
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

// The world: no gate (the choice is saved), no HUD and no controls.
const scene = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
})
await scene.addInitScript(() => localStorage.setItem('sound:enabled', '0'))
await scene.goto(world)
await scene.addStyleTag({
  content: '[data-hud], button, a { visibility: hidden !important }',
})
// The camera settles and the icons load.
await scene.waitForTimeout(15_000)
const backdrop = await scene.screenshot({ type: 'jpeg', quality: 92 })

const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(`file://${html}`)
await page.evaluate((data) => {
  document.body.style.setProperty(
    '--world',
    `url(data:image/jpeg;base64,${data})`,
  )
}, backdrop.toString('base64'))
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: out })
await browser.close()
console.log(`Wrote ${out}`)
