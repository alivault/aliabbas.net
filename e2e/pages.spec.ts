import { expect, test, open } from './fixtures'
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
        // Skip hidden text, the HUD of the world (spaced capitals by
        // design), and the TanStack devtools of the dev server.
        element.closest(
          '.sr-only, [aria-hidden="true"], [data-hud], script, style, [class*="tsqd"], [class*="tanstack"]',
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
  '/work/postmaster',
  '/performance',
  '/design',
]) {
  test(
    `${path} has no text under 14px and no CSS capitals`,
    { tag: '@mobile' },
    async ({ page }) => {
      await open(page, path)
      await expect(page.locator('main')).toBeVisible()
      expect(await smallText(page)).toEqual([])
    },
  )
}

// The server HTML, as a link preview reads it: no JavaScript runs.
for (const path of [
  '/',
  '/work',
  '/work/pico',
  '/skills',
  '/experience',
  '/lab',
  '/notes',
  '/notes/building-pico-a-local-first-workspace-for-coding-agents',
  '/chat',
  '/check',
  '/contact',
  '/design',
  '/performance',
  '/privacy',
]) {
  test(`${path} has Open Graph tags and the share image`, async ({
    request,
  }) => {
    const html = await (await request.get(path)).text()
    const tag = (key: string) =>
      [
        ...html.matchAll(
          new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`, 'g'),
        ),
      ].map((match) => match[1])

    const url =
      path === '/' ? 'https://aliabbas.net' : `https://aliabbas.net${path}`
    expect(tag('og:url')).toEqual([url])
    expect(html).toContain(`<link rel="canonical" href="${url}"/>`)
    for (const key of [
      'og:title',
      'og:description',
      'og:type',
      'og:site_name',
      'og:image:alt',
      'twitter:card',
      'twitter:title',
      'twitter:description',
    ]) {
      expect(tag(key), key).toHaveLength(1)
    }
    expect(tag('og:image')).toEqual(['https://aliabbas.net/og-image.png?v=3'])
    expect(tag('twitter:image')).toEqual(tag('og:image'))
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

test(
  'a page blurs the top corners only after it scrolls',
  { tag: '@mobile' },
  async ({ page }) => {
    await open(page, '/work/pico')
    const blur = page.locator('[data-header-blur]')
    const opacity = () =>
      blur.evaluate((element) => getComputedStyle(element).opacity)
    await expect.poll(opacity).toBe('0')
    await page.evaluate(() => window.scrollTo({ top: 600 }))
    await expect.poll(opacity).toBe('1')
  },
)

test('the index blurs the top corners once it scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 500 })
  await open(page, '/')
  await page.getByRole('button', { name: 'Index' }).click()
  const index = page.getByRole('dialog', { name: 'Index' })
  await expect(index).toBeVisible()
  const blur = page.locator('[data-header-blur]')
  const opacity = () =>
    blur.evaluate((element) => getComputedStyle(element).opacity)
  await expect.poll(opacity).toBe('0')
  await index.evaluate((element) => element.scrollTo({ top: 300 }))
  await expect.poll(opacity).toBe('1')
  await index.evaluate((element) => element.scrollTo({ top: 0 }))
  await expect.poll(opacity).toBe('0')
})

test('Esc on a page goes back to the world', async ({ page }) => {
  await open(page, '/work')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/$/)
})

test(
  'the index opens over the world and closes with Esc and Return',
  { tag: '@mobile' },
  async ({ page }) => {
    await open(page, '/')
    const index = page.getByRole('button', { name: 'Index' })
    await index.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('link', { name: /^Lab/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    await index.click()
    await page.getByRole('button', { name: 'Return' }).click()
    await expect(dialog).toBeHidden()

    // Ali Abbas, the way home, closes the index too.
    await index.click()
    await page.getByRole('link', { name: 'Ali Abbas' }).click()
    await expect(dialog).toBeHidden()

    await index.click()
    await dialog.getByRole('link', { name: /^Lab/ }).click()
    await expect(page).toHaveURL(/\/lab$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lab')
  },
)

test('without a GPU, the home page lists the pages', async ({ page }) => {
  // Headless Chromium has no GPU: the world is a list over a still sky.
  await open(page, '/')
  const pages = page.getByRole('navigation', { name: 'Pages' })
  await expect(
    pages.getByRole('link', { name: 'Ask about Ali' }),
  ).toHaveAttribute('href', '/chat')
})

test('a figure zooms, the arrows step, and Esc zooms it back', async ({
  page,
}) => {
  await open(page, '/work/pico')
  const figures = page.getByRole('button', { name: /^Zoom: / })
  await expect(figures).toHaveCount(3)
  await figures.first().click()
  const view = page.getByRole('dialog', { name: 'Zoomed media' })
  await expect(view).toBeVisible()
  await expect(view.getByText('1/3')).toBeVisible()
  await expect(view.getByRole('button', { name: 'Close' })).toBeFocused()

  await page.keyboard.press('ArrowRight')
  await expect(view.getByText('2/3')).toBeVisible()
  // The demo video plays with its controls.
  await expect(view.locator('video')).toHaveAttribute(
    'src',
    '/work/pico/child-sessions.mp4',
  )
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(view.getByText('3/3')).toBeVisible()

  // Esc closes the view, not the page, and focus goes back to the figure.
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/work\/pico$/)
  await expect(figures.first()).toBeFocused()
})

test('the case studies with pictures load them', async ({ page }) => {
  // Postmaster has no pictures.
  for (const slug of ['pico', 'whimcall']) {
    await open(page, `/work/${slug}`)
    const image = page.locator('main figure img').first()
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) =>
          element.complete ? element.naturalWidth : 0,
        ),
      )
      .toBeGreaterThan(0)
  }
})

test('the work page links to each project', async ({ page }) => {
  await open(page, '/work')
  for (const slug of ['pico', 'whimcall', 'postmaster']) {
    await expect(
      page.locator(`main a[href="/work/${slug}"]`).first(),
    ).toBeVisible()
  }
  await expect(
    page.locator('main a[href="https://chromagine.aliabbas.net/"]').first(),
  ).toBeAttached()
})
