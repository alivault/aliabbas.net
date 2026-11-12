import { expect, test, open } from './fixtures'

test('the notes list links to each note, and focus fills the link', async ({
  page,
}) => {
  await open(page, '/notes')
  const links = page.locator('main a[href^="/notes/"]')
  await expect(links.nth(1)).toBeVisible()
  await links.nth(1).focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(links.nth(1)).toBeFocused()
  // The hud-fill: a background that grows to the full height.
  await expect
    .poll(() =>
      links
        .nth(1)
        .evaluate((element) => getComputedStyle(element).backgroundSize),
    )
    .toBe('100% 100%')
})
