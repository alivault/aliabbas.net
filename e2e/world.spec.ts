import { expect, open, test } from './fixtures'

// The world needs WebGL: ?gl=force draws it with software WebGL. It is slow,
// so these tests have more time.
test.describe.configure({ timeout: 90_000 })

test('far from the pages, the HUD says so, and an arrow flies back', async ({
  page,
}) => {
  await open(page, '/?gl=force')
  await page.getByRole('button', { name: /Enter in silence/i }).click()
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
