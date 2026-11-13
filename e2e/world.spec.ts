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

test('a drag on a cube spins it, and a click still opens its page', async ({
  page,
}) => {
  needsFrames()
  await open(page, '/?gl=force')
  await page.getByRole('button', { name: 'Enter', exact: true }).click()
  await page.waitForTimeout(1500)

  // Find a cube: the label at the bottom names the one under the pointer.
  const label = page.locator('[data-hud] p[aria-live="polite"]')
  let cube: { x: number; y: number } | null = null
  for (let y = 250; y < 600 && !cube; y += 25) {
    for (let x = 100; x < 1300 && !cube; x += 25) {
      await page.mouse.move(x, y)
      if ((await label.textContent())?.trim()) cube = { x, y }
    }
  }
  if (!cube) throw new Error('No cube under the pointer')
  const name = (await label.textContent())?.trim()

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
  await expect(gate).toBeFocused()
  await expect(gate).toContainText('senior frontend and design engineer')
  await expect(
    gate.getByRole('button', { name: 'Enter in silence' }),
  ).toHaveCount(0)
  // Tab reaches the first link of the text; no control shows as chosen.
  await page.keyboard.press('Tab')
  await expect(gate.getByRole('link', { name: 'Pico' })).toBeFocused()
  await gate.getByRole('button', { name: 'Enter', exact: true }).click()
  await expect(gate).toBeHidden()
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
