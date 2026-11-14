import { expect, open, test } from './fixtures'

// The world needs WebGL: ?gl=force draws it with software WebGL. It is slow,
// so these tests have more time.
test.describe.configure({ timeout: 90_000 })

/**
 * Tests that walk or drag in the world need a steady frame rate. The CI
 * runners draw software WebGL at a few frames a second, so there these
 * tests run only on a developer machine.
 */
const needsFrames = () =>
  test.skip(!!process.env.CI, 'Software WebGL in CI is too slow to walk.')

test('far from the pages, the HUD says so, and an arrow flies back', async ({
  page,
}) => {
  needsFrames()
  await open(page, '/?gl=force')
  await page.getByRole('button', { name: 'Enter', exact: true }).click()
  const hint = page.getByText('Lost? Click Next')
  await expect(hint).toHaveCount(0)

  // Run backward, away from the pages, until the HUD says lost.
  await page.mouse.move(640, 300)
  await page.keyboard.down('Shift')
  await page.keyboard.down('s')
  await expect(hint).toHaveCSS('opacity', '1', { timeout: 60_000 })
  await page.keyboard.up('s')
  await page.keyboard.up('Shift')
  // The hint is at the bottom, in line with Next.
  const hintBox = (await hint.boundingBox())!
  const nextBox = (await page
    .getByRole('button', { name: 'Next', exact: true })
    .boundingBox())!
  expect(
    Math.abs(hintBox.y + hintBox.height / 2 - (nextBox.y + nextBox.height / 2)),
  ).toBeLessThan(3)

  // Turn away from the pages: arrows point to the nearest ones.
  await page.mouse.move(150, 600)
  await page.mouse.down()
  await page.mouse.move(1050, 600, { steps: 30 })
  await page.mouse.up()
  const arrow = page.locator('button[title]:not([aria-label])').first()
  await expect(arrow).toHaveCSS('opacity', '1')

  await arrow.click({ force: true })
  await expect(hint).toHaveCount(0, { timeout: 30_000 })
})

test('a scroll glides through the world, and the page does not scroll', async ({
  page,
}) => {
  needsFrames()
  await open(page, '/?gl=force')
  await page.getByRole('button', { name: 'Enter', exact: true }).click()
  const hint = page.getByText('Lost? Click Next')
  await expect(hint).toHaveCount(0)

  // Scroll up, to glide backward, away from the pages, until the HUD says
  // lost.
  await page.mouse.move(640, 300)
  await expect(async () => {
    for (let n = 0; n < 10; n++) await page.mouse.wheel(0, -200)
    await expect(hint).toHaveCSS('opacity', '1', { timeout: 1000 })
  }).toPass({ timeout: 60_000 })
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('a drag on a cube spins it, and a click still opens its page', async ({
  page,
}) => {
  needsFrames()
  await open(page, '/?gl=force')
  await page.getByRole('button', { name: 'Enter', exact: true }).click()
  await page.waitForTimeout(1500)

  // Find a cube: the label at the bottom names the one under the pointer.
  // The name of the icon under the pointer (the last live line of the HUD:
  // the name of the music comes first).
  const label = page.locator('[data-hud] p[aria-live="polite"]').last()
  let cube: { x: number; y: number } | null = null
  for (let y = 250; y < 600 && !cube; y += 25) {
    for (let x = 100; x < 1300 && !cube; x += 25) {
      await page.mouse.move(x, y)
      if ((await label.textContent())?.trim()) cube = { x, y }
    }
  }
  if (!cube) throw new Error('No cube under the pointer')
  // The first point found is on the edge of the icon, and the icon bobs:
  // go a little inside, where it stays under the pointer.
  const name = (await label.textContent())?.trim()
  const inside = { x: cube.x + 30, y: cube.y + 30 }
  await page.mouse.move(inside.x, inside.y)
  if ((await label.textContent())?.trim() === name) cube = inside

  await page.mouse.down()
  await page.mouse.move(cube.x + 200, cube.y + 60, { steps: 12 })
  await page.mouse.up()
  // A spin, not a click: the page did not open.
  await page.waitForTimeout(300)
  await expect(page).toHaveURL(/\/\?gl=force$/)

  // The view did not turn: the same cube is still under the pointer.
  await page.waitForTimeout(2000)
  await page.mouse.move(cube.x, cube.y)
  await expect(label).toHaveText(name ?? '')
  await page.mouse.click(cube.x, cube.y)
  await expect(page).not.toHaveURL(/\/\?gl=force$/)
})

test('on a page, the pointer reaches the cube beside the text', async ({
  page,
}) => {
  await open(page, '/skills?gl=force')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // The cube is on the right half; the text is on the left.
  // The world loads after the page: wait for its canvas.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.elementFromPoint(innerWidth * 0.75, innerHeight * 0.5)
              ?.tagName,
        ),
      { timeout: 30_000 },
    )
    .toBe('CANVAS')
  // The text still takes the pointer.
  await page.getByRole('link', { name: 'Force each state in the lab' }).click()
  await expect(page).toHaveURL(/\/lab/)
})

test('the gate shows the intro on each visit, and Enter goes in', async ({
  page,
}) => {
  // A visitor who came before still sees the gate.
  await page.addInitScript(() => localStorage.setItem('sound:enabled', '1'))
  await open(page, '/?gl=force')
  const gate = page.getByRole('dialog', { name: 'Ali Abbas' })
  await expect(gate).toBeVisible()
  await expect(gate).toContainText('senior frontend and design engineer')
  await expect(
    gate.getByRole('button', { name: 'Enter in silence' }),
  ).toHaveCount(0)
  // Enter has the focus, so the Enter key goes in at once.
  await expect(
    gate.getByRole('button', { name: 'Enter', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(gate).toBeHidden()
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('the intro types in, and a click on it shows all of it', async ({
  page,
}) => {
  await open(page, '/?gl=force')
  const intro = page.locator('#gate-intro')
  const hidden = intro.locator('span.text-transparent')
  await expect(hidden.first()).toBeAttached()
  await intro.click({ position: { x: 10, y: 10 } })
  await expect(hidden).toHaveCount(0)
})

test('with reduced motion, the intro shows at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, '/?gl=force')
  await expect(page.locator('#gate-intro')).toBeVisible()
  await expect(page.locator('#gate-intro span.text-transparent')).toHaveCount(0)
})

test('as the intro types in, no letter moves', async ({ page }) => {
  await open(page, '/?gl=force')
  // The place of each letter, as one string.
  const places = () =>
    page.evaluate(() =>
      Array.from(
        document.querySelectorAll('#gate-intro span:not([aria-hidden])'),
        (letter) => {
          const box = letter.getBoundingClientRect()
          return `${Math.round(box.x)},${Math.round(box.y)}`
        },
      ).join(' '),
    )
  const seen: Array<string> = []
  for (let i = 0; i < 40; i++) {
    seen.push(await places())
    await page.waitForTimeout(50)
  }
  await page.locator('#gate-intro').click({ position: { x: 10, y: 10 } })
  const end = await places()
  expect(seen.filter((at) => at !== end)).toHaveLength(0)
})

test('a click on the ground plays a swoop as long as the dash', async ({
  page,
}) => {
  needsFrames()
  // Record each swoop: its rush of air ends at 500 Hz, at the end of the
  // move. The time from now to there is its length.
  await page.addInitScript(() => {
    const w = window as unknown as { swoops: Array<number> }
    w.swoops = []
    // It is called with its AudioParam below.
    // eslint-disable-next-line typescript/unbound-method
    const ramp = AudioParam.prototype.exponentialRampToValueAtTime
    AudioParam.prototype.exponentialRampToValueAtTime = function (value, time) {
      const context = (window as unknown as { __audio?: AudioContext }).__audio
      if (value === 500 && context) w.swoops.push(time - context.currentTime)
      return ramp.call(this, value, time)
    }
    const Context = window.AudioContext
    window.AudioContext = class extends Context {
      constructor(options?: AudioContextOptions) {
        super(options)
        ;(window as unknown as { __audio: AudioContext }).__audio = this
      }
    }
  })
  await open(page, '/?gl=force')
  await page.getByRole('button', { name: 'Enter', exact: true }).click()
  await page.waitForTimeout(1500)
  const swoops = () =>
    page.evaluate(() => (window as unknown as { swoops: Array<number> }).swoops)
  // Near the bottom of the screen: the ground, a few meters away.
  await page.mouse.click(720, 860)
  await expect.poll(async () => (await swoops()).length).toBe(1)
  const [near] = await swoops()
  await page.waitForTimeout(2500)
  // Near the horizon: far away, so a longer dash.
  await page.mouse.click(720, 560)
  await expect.poll(async () => (await swoops()).length).toBe(2)
  const [, far] = await swoops()
  expect(near).toBeGreaterThan(0.3)
  expect(far).toBeGreaterThan(near)
})
