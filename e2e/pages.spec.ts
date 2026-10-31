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

// The footer is in the page flow, so all of it can be reached, also on a
// short screen.
for (const [width, height] of [
  [1440, 700],
  [390, 600],
] as const) {
  test(`the whole footer can be reached at ${width}x${height}`, async ({
    page,
  }) => {
    test.skip(!isDesktop(page), 'The test sets its own viewport.')
    await page.setViewportSize({ width, height })
    await open(page, '/work/pico')
    const footer = page.locator('footer.site-footer')
    const top = footer.getByRole('heading', { name: 'Portfolio' })
    await top.scrollIntoViewIfNeeded()
    await expect(top).toBeInViewport()
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight }),
    )
    await expect(
      footer.getByText('Designed and engineered with intent.'),
    ).toBeInViewport({ ratio: 1 })
  })
}

test('the hero actions go to the work and to the chat', async ({ page }) => {
  await open(page, '/')
  // The closing section repeats the links, so look in the hero only.
  const hero = page.locator('section').filter({ has: page.locator('h1') })
  await hero.getByRole('link', { name: 'See the work' }).click()
  await expect(page).toHaveURL(/#work$/)
  await expect(
    page.getByRole('heading', { name: 'Recent work' }),
  ).toBeInViewport()

  await page.evaluate(() => window.scrollTo({ top: 0 }))
  await hero.getByRole('link', { name: 'Ask AI about me' }).click()
  await expect(page).toHaveURL(/\/chat$/)
})

test('each page ends with the closing call to action, except Contact', async ({
  page,
}) => {
  await open(page, '/work')
  const closing = page.getByRole('heading', {
    name: 'Hard problem, high bar? That’s my favorite kind.',
  })
  await expect(closing).toBeAttached()
  const actions = closing.locator('..')
  await expect(actions.getByRole('link', { name: 'Contact' })).toHaveAttribute(
    'href',
    '/contact',
  )
  await expect(
    actions.getByRole('link', { name: 'Ask AI about me' }),
  ).toHaveAttribute('href', '/chat')

  await open(page, '/contact')
  await expect(page.locator('footer.site-footer')).toBeAttached()
  await expect(closing).toHaveCount(0)
})
