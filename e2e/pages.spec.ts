import { expect, isDesktop, test, open } from './fixtures'
import type { Page } from '@playwright/test'

/**
 * Visible text under 14px, or in capitals by CSS, in the whole page: the
 * header, the content and the footer.
 */
function smallText(page: Page) {
  return page.evaluate(() => {
    const found = new Set<string>()
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    )
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim()
      const element = node.parentElement
      if (
        !text ||
        !element ||
        // Skip hidden text, and the TanStack devtools of the dev server.
        element.closest(
          '.sr-only, [aria-hidden="true"], script, style, [class*="tsqd"], [class*="tanstack"]',
        )
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

// /play is not here: it uses the display type of the game, in capitals.
for (const path of [
  '/',
  '/work',
  '/skills',
  '/experience',
  '/notes',
  '/contact',
  '/privacy',
  '/lab',
  '/chat',
  '/check',
  '/work/pico',
  '/performance',
  '/design',
]) {
  test(`${path} has no text under 14px and no CSS capitals`, async ({
    page,
  }) => {
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

test('/design/tokens.json lists the tokens and the rules', async ({
  request,
}) => {
  const response = await request.get('/design/tokens.json')
  expect(response.ok()).toBe(true)
  const tokens = await response.json()
  expect(tokens.color.background.light).toMatch(/^oklch\(/)
  expect(tokens.color.background.dark).toMatch(/^oklch\(/)
  expect(tokens.motion.springs.layout).toMatchObject({ type: 'spring' })
  expect(tokens.rules.length).toBeGreaterThan(10)
})

for (const [path, types] of [
  ['/', ['Person', 'WebSite']],
  ['/work/pico', ['TechArticle', 'BreadcrumbList']],
] as const) {
  test(`${path} has JSON-LD: ${types.join(', ')}`, async ({ page }) => {
    await page.goto(path)
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents()
    const nodes = blocks.flatMap((block) => {
      const data = JSON.parse(block) as {
        '@graph'?: Array<{ '@type': string }>
      }
      return data['@graph'] ?? [data as { '@type': string }]
    })
    expect(nodes.map((node) => node['@type'])).toEqual(types)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`^https://aliabbas\\.net${path === '/' ? '' : path}$`),
    )
  })
}

// A wide, short screen makes the footer content taller than the screen,
// because the wordmark grows with the width. Then the footer is a normal
// block, so its bottom can be reached.
for (const [width, height, mode] of [
  [1440, 900, 'fixed'],
  [1440, 700, 'static'],
  [390, 1000, 'fixed'],
  [390, 600, 'static'],
] as const) {
  test(`the whole footer can be reached at ${width}x${height} (${mode})`, async ({
    page,
  }) => {
    test.skip(!isDesktop(page), 'The test sets its own viewport.')
    await page.setViewportSize({ width, height })
    await open(page, '/work/pico')
    const footer = page.locator('footer.site-footer')
    if (mode === 'static') {
      await expect(footer).toHaveAttribute('data-static', '')
    } else {
      await expect(footer).not.toHaveAttribute('data-static')
    }
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight }),
    )
    const top = footer.getByRole('heading', { level: 2 })
    const bottom = footer.getByText('Designed and engineered with intent.')
    await expect(bottom).toBeInViewport({ ratio: 1 })
    // At the end of the page, the top of the footer is in view, or it is
    // above the screen because the footer is a normal block.
    if (mode === 'fixed') await expect(top).toBeInViewport({ ratio: 1 })
  })
}
