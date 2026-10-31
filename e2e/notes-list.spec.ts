import { expect, isDesktop, test, open } from './fixtures'
import type { Locator } from '@playwright/test'

const color = (row: Locator) =>
  row.evaluate((element) => getComputedStyle(element).color)

// Only /notes: in the tests, the home page reads no notes from Sanity, so
// it shows its empty state. Both lists use the same classes.
for (const path of ['/notes']) {
  test(`${path}: hover or focus on a note dims the other notes`, async ({
    page,
  }) => {
    await open(page, path)
    const rows = page.locator('.group\\/notes a[href^="/notes/"]')
    await rows.nth(1).scrollIntoViewIfNeeded()
    await expect(rows.nth(1)).toBeVisible()
    const rest = await color(rows.nth(0))

    if (isDesktop(page)) {
      await rows.nth(1).hover()
      await expect.poll(() => color(rows.nth(0))).not.toBe(rest)
      await expect.poll(() => color(rows.nth(1))).toBe(rest)
      await page.mouse.move(0, 0)
      await expect.poll(() => color(rows.nth(0))).toBe(rest)
    }

    await rows.nth(1).focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(rows.nth(1)).toBeFocused()
    await expect.poll(() => color(rows.nth(0))).not.toBe(rest)
    await expect.poll(() => color(rows.nth(1))).toBe(rest)
  })
}
