import { expect, isDesktop, test, open } from './fixtures'
import type { Page } from '@playwright/test'

/** Visible text under 14px, or in capitals by CSS. */
function smallText(page: Page) {
  return page.evaluate(() => {
    const found = new Set<string>()
    const main = document.querySelector('main')
    if (!main) return []
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim()
      const element = node.parentElement
      if (
        !text ||
        !element ||
        element.closest('.sr-only, [aria-hidden="true"]')
      )
        continue
      const style = getComputedStyle(element)
      if (
        style.visibility === 'hidden' ||
        element.getClientRects().length === 0
      )
        continue
      if (
        parseFloat(style.fontSize) < 14 ||
        style.textTransform === 'uppercase'
      ) {
        found.add(
          `${style.fontSize} ${style.textTransform} "${text.slice(0, 40)}"`,
        )
      }
    }
    return [...found]
  })
}

/** Pages that still have small labels. Remove a page when it is cleaned. */
const SMALL_TEXT_TODO = new Set(['/', '/performance'])

for (const path of [
  '/',
  '/lab',
  '/chat',
  '/check',
  '/work/pico',
  '/performance',
]) {
  test(`${path} has no text under 14px and no CSS capitals`, async ({
    page,
  }) => {
    test.fixme(SMALL_TEXT_TODO.has(path), 'This page still has small labels.')
    await open(page, path)
    await expect(page.locator('main')).toBeVisible()
    expect(await smallText(page)).toEqual([])
  })
}

for (const [path, name, target] of [
  ['/lab', 'Specimens', 'fluid-resizer'],
  ['/work/pico', 'On this page', 'failure-modes'],
] as const) {
  test(`${path}: the section nav sticks and marks the section in view`, async ({
    page,
  }) => {
    test.skip(!isDesktop(page), 'The section nav is a desktop layout.')
    await open(page, path)
    const nav = page.getByRole('navigation', { name })
    await nav
      .getByRole('link')
      .filter({ has: page.locator(`[href$="#${target}"]`) })
      .or(nav.locator(`a[href$="#${target}"]`))
      .first()
      .click()

    await expect(page).toHaveURL(new RegExp(`#${target}$`))
    await expect(nav.locator('[aria-current="location"]')).toHaveAttribute(
      'href',
      new RegExp(`#${target}$`),
    )
    const navBox = await nav.boundingBox()
    const section = await page.locator(`#${target}`).boundingBox()
    expect(navBox?.y ?? -1).toBeGreaterThanOrEqual(0)
    // The section starts below the bar, not under it.
    expect(section?.y ?? 0).toBeGreaterThanOrEqual(
      (navBox?.y ?? 0) + (navBox?.height ?? 0),
    )
  })
}
