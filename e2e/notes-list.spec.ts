import { expect, isDesktop, test, open } from './fixtures'
import type { Locator } from '@playwright/test'

const color = (row: Locator) =>
  row.evaluate((element) => getComputedStyle(element).color)

// Only /notes: in the tests, the home page reads no notes from Sanity, so
// it shows its empty state. Both lists use the same classes.
test('hover or focus on a note turns its title to the brand color', async ({
  page,
}) => {
  await open(page, '/notes')
  const rows = page.locator('main ul a[href^="/notes/"]')
  await expect(rows.nth(1)).toBeVisible()
  const rest = await color(rows.nth(1))
  const brand = await page.evaluate(() => {
    const probe = document.createElement('span')
    probe.className = 'text-brand'
    document.body.appendChild(probe)
    const value = getComputedStyle(probe).color
    probe.remove()
    return value
  })

  if (isDesktop(page)) {
    await rows.nth(1).hover()
    await expect.poll(() => color(rows.nth(1))).toBe(brand)
    await expect.poll(() => color(rows.nth(0))).toBe(rest)
    await page.mouse.move(0, 0)
    await expect.poll(() => color(rows.nth(1))).toBe(rest)
  }

  await rows.nth(1).focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(rows.nth(1)).toBeFocused()
  await expect.poll(() => color(rows.nth(1))).toBe(brand)
})
