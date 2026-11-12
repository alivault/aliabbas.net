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

test(
  'the work stage shows the project in the middle of the screen',
  { tag: '@mobile' },
  async ({ page }) => {
    await open(page, '/work')
    const stage = page.locator('[data-work-stage]')
    if (!isDesktop(page)) {
      // Small screens have no stage: each project shows its own block.
      await expect(stage).toBeHidden()
      await expect(
        page.getByRole('link', { name: 'Read the Whimcall case study' }),
      ).toBeVisible()
      return
    }
    // The blocks are the faces of a cube that turns with the scroll. Hit
    // testing follows the 3D transform, so the link at the center of the
    // stage is the face that points at the screen.
    const blockOnTop = () =>
      stage.evaluate((element) => {
        const box = element.getBoundingClientRect()
        const hit = document
          .elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
          ?.closest('a')
        return [...element.querySelectorAll('a')].indexOf(hit!)
      })
    // Scroll until the middle of the row is level with the middle of the
    // stage. The stage is sticky only after the first scroll, so repeat.
    const alignWithStage = (title: string) =>
      page.evaluate((title) => {
        const row = document
          .querySelector(`[data-work-item="${title}"]`)!
          .getBoundingClientRect()
        const stage = document
          .querySelector('[data-work-stage] > div')!
          .getBoundingClientRect()
        window.scrollBy(
          0,
          row.top + row.height / 2 - (stage.top + stage.height / 2),
        )
      }, title)
    const titles = ['Pico', 'Whimcall', 'Postmaster']
    await expect(stage).toHaveAttribute('data-work-stage', 'Pico')
    // The face of a project points at the screen when its text is level
    // with it.
    for (const title of ['Whimcall', 'Postmaster', 'Pico']) {
      await expect
        .poll(async () => {
          await alignWithStage(title)
          return blockOnTop()
        })
        .toBe(titles.indexOf(title))
      await expect(stage).toHaveAttribute('data-work-stage', title)
    }
  },
)

test('a secondary button shows a turning chrome border on hover', async ({
  page,
}) => {
  test.skip(!isDesktop(page), 'Hover needs a pointer.')
  await open(page, '/')
  const button = page.locator('header').getByRole('link', { name: 'Contact' })
  const ring = () =>
    button.evaluate((element) => {
      const style = getComputedStyle(element, '::before')
      return { opacity: style.opacity, animation: style.animationName }
    })

  await expect.poll(ring).toEqual({ opacity: '0', animation: 'none' })
  await button.hover()
  await expect.poll(ring).toEqual({ opacity: '1', animation: 'chrome-turn' })

  // With reduced motion, the ring shows but does not turn.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(ring).toEqual({ opacity: '1', animation: 'none' })
})

test('a primary button fills with liquid metal on hover', async ({ page }) => {
  test.skip(!isDesktop(page), 'Hover needs a pointer.')
  await open(page, '/')
  const button = page.locator('main .liquid-metal', { hasText: 'See the work' })
  // "on": the shader draws it. "static": no WebGL, so CSS draws it.
  const state = () =>
    button.evaluate((element) => element.dataset.liquidMetal ?? 'off')
  const label = () =>
    button.evaluate((element) => getComputedStyle(element).color)

  await expect.poll(state).toBe('off')
  const before = await label()
  await button.hover()
  await expect.poll(state).toMatch(/^(on|static)$/)
  // The label turns light on the dark metal.
  await expect.poll(label).not.toBe(before)
  await page.mouse.move(4, 400)
  await expect.poll(state).toBe('off')

  // With reduced motion, the metal still shows, as a still frame.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await button.hover()
  await expect.poll(state).toMatch(/^(on|static)$/)
})

test('each case study shows the icon of its app', async ({ page }) => {
  for (const [slug, image] of [
    ['pico', '/pico.svg'],
    ['whimcall', '/whimcall.png'],
    ['postmaster', '/postmaster.webp'],
  ]) {
    await open(page, `/work/${slug}`)
    const icon = page.locator('header [data-app-icon]')
    await expect(icon).toHaveAttribute('src', image)
    // The heading names the app, so the icon is decorative.
    await expect(icon).toHaveAttribute('alt', '')
    await expect
      .poll(() =>
        icon.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0)
  }
})

test('the Pico case study shows its screenshots and its demo video', async ({
  page,
}) => {
  const loaded = (image: ReturnType<typeof page.locator>) =>
    expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) =>
          element.complete ? element.naturalWidth : 0,
        ),
      )
      .toBeGreaterThan(0)

  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await open(page, '/work/pico')
    const hero = page.getByRole('img', { name: /^The Pico workspace\./ })
    await expect(hero).toBeVisible()
    await loaded(hero)
    // The picture shows the screenshot of the color scheme of the reader.
    await expect
      .poll(() =>
        hero.evaluate((element: HTMLImageElement) => element.currentSrc),
      )
      .toContain(`/work/pico/workspace-${scheme}.webp`)
  }

  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Demo' })
    .click()
  const demo = page.locator('#demo')
  await expect(
    demo.getByRole('heading', { name: 'See it work' }),
  ).toBeInViewport()
  const video = demo.locator('video')
  await expect(video).toHaveAttribute('src', '/work/pico/child-sessions.mp4')
  await expect(video).toHaveAttribute('controls', '')
  await expect(video).toHaveAccessibleDescription(/has no sound/)
  const phone = demo.getByRole('img', { name: /on a phone/ })
  await phone.scrollIntoViewIfNeeded()
  await loaded(phone)
})

test('the Whimcall case study shows the call and the full-room page', async ({
  page,
}) => {
  await open(page, '/work/whimcall')
  const naturalWidth = (image: ReturnType<typeof page.locator>) =>
    image.evaluate((element: HTMLImageElement) =>
      element.complete ? element.naturalWidth : 0,
    )
  const hero = page.getByRole('img', { name: /^A Whimcall call/ })
  await expect.poll(() => naturalWidth(hero)).toBeGreaterThan(0)

  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Screens' })
    .click()
  const screens = page.locator('#demo')
  await expect(
    screens.getByRole('heading', { name: 'The call' }),
  ).toBeInViewport()
  // Four screenshots of the call and one of the phone, each with a caption.
  await expect(screens.locator('figure')).toHaveCount(5)
  await expect(screens.locator('figure figcaption')).toHaveCount(5)
  await expect(screens.locator('video')).toHaveCount(0)

  // The failure mode about seats shows the page that a third person sees.
  const full = page.getByRole('img', { name: /This call is full\./ })
  await full.scrollIntoViewIfNeeded()
  await expect.poll(() => naturalWidth(full)).toBeGreaterThan(0)
  await expect(
    page
      .locator('li')
      .filter({ has: full })
      .getByRole('heading', { name: 'Two devices claim one seat' }),
  ).toBeVisible()
})

test('the side projects are in two columns on wide screens', async ({
  page,
}) => {
  await open(page, '/work')
  const section = page.getByRole('region', { name: 'Side projects' })
  const averno = section.getByRole('heading', { name: 'Averno' })
  const chromagine = section.getByRole('heading', { name: 'Chromagine' })
  await expect(averno).toBeVisible()
  await expect(
    section.getByRole('link', { name: /Visit site : Chromagine/ }),
  ).toHaveAttribute('href', 'https://chromagine.aliabbas.net/')
  const a = await averno.boundingBox()
  const c = await chromagine.boundingBox()
  if (!a || !c) throw new Error('No box for a side project title')
  if (isDesktop(page)) {
    // Side by side: one row, two columns.
    expect(Math.abs(a.y - c.y)).toBeLessThan(2)
    expect(c.x).toBeGreaterThan(a.x + a.width)
  } else {
    // One column: Chromagine is under Averno.
    expect(c.y).toBeGreaterThan(a.y + a.height)
  }
})
