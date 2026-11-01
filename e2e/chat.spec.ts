import {
  SOURCES,
  chatAnswer,
  expect,
  isDesktop,
  mockAi,
  open,
  test,
} from './fixtures'
import type { Page } from '@playwright/test'

const composer = (page: Page) =>
  page.locator(
    isDesktop(page)
      ? 'textarea#portfolio-question-initial'
      : 'textarea#portfolio-question-initial-mobile',
  )

test('an answer streams with citations, and a chip shows its source', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/chat')
  await composer(page).fill('Has Ali built streaming interfaces?')
  await page.keyboard.press('Enter')

  await expect(page.getByText(/done in/)).toBeVisible()
  const chip = page.getByRole('button', {
    name: `Source 2: ${SOURCES.whimcall.title}`,
  })
  await expect(chip).toBeVisible()

  await chip.click()
  if (!isDesktop(page)) await expect(page.getByRole('dialog')).toBeVisible()
  const card = page.locator(':focus')
  await expect(card).toContainText(SOURCES.whimcall.title)
  await expect(card).toBeInViewport({ ratio: 0.5 })
})

test('Esc stops the answer and keeps the text that arrived', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer(250) })
  await open(page, '/chat')
  await composer(page).fill('Has Ali built streaming interfaces?')
  await page.keyboard.press('Enter')

  // The first chip shows that the answer is part way through.
  await expect(page.getByRole('button', { name: /^Source 1:/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Stopped', { exact: true })).toBeVisible()
  const text = await page.getByRole('article').last().innerText()
  await page.waitForTimeout(800)
  expect(await page.getByRole('article').last().innerText()).toBe(text)
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
})

test('Retry sends the question again as a new attempt', async ({ page }) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/chat')
  await composer(page).fill('Which project is the strongest?')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Regenerate' }).click()
  await expect(page.getByText(/done in/)).toBeVisible()

  const requests = await page.evaluate(
    () =>
      (
        window as unknown as {
          __aiRequests: Array<{ body: { requestId: string } }>
        }
      ).__aiRequests,
  )
  expect(requests).toHaveLength(2)
  expect(requests[0]?.body.requestId).not.toBe(requests[1]?.body.requestId)
})

test('switching to Check keeps the chat draft', async ({ page }) => {
  await open(page, '/chat')
  await composer(page).fill('a draft that must survive')
  const modes = page.getByRole('navigation', { name: 'Assistant mode' })
  await modes.getByRole('link', { name: 'Check a claim' }).click()
  await expect(page).toHaveURL(/\/check/)
  await modes.getByRole('link', { name: 'Ask a question' }).click()
  await expect(page).toHaveURL(/\/chat/)
  await expect(composer(page)).toHaveValue('a draft that must survive')
})

test('the checker has the footer, and the chat does not', async ({ page }) => {
  await open(page, '/check')
  await expect(page.locator('footer.site-footer')).toHaveCount(1)
  await page
    .getByRole('navigation', { name: 'Assistant mode' })
    .getByRole('link', { name: 'Ask a question' })
    .click()
  await expect(page).toHaveURL(/\/chat/)
  await expect(page.locator('footer.site-footer')).toHaveCount(0)
})

test('the sources button looks pressed while the evidence shows', async ({
  page,
}) => {
  test.skip(
    !isDesktop(page),
    'On mobile the evidence opens in a dialog, not beside the answer.',
  )
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/chat')
  await composer(page).fill('Has Ali built streaming interfaces?')
  await page.keyboard.press('Enter')
  await expect(page.getByText(/done in/)).toBeVisible()

  const toggle = page.getByRole('button', { name: /2 sources: .* evidence/ })
  const fill = () =>
    toggle.evaluate((element) => getComputedStyle(element).backgroundColor)

  const transparent = 'rgba(0, 0, 0, 0)'
  // Wait for the fill transition to end after each change.
  const expectFill = async (pressed: boolean) => {
    await expect(toggle).toHaveAttribute('aria-pressed', String(pressed))
    // Move the pointer away, so the hover fill does not hide the difference.
    await page.mouse.move(0, 0)
    if (pressed) await expect.poll(fill).not.toBe(transparent)
    else await expect.poll(fill).toBe(transparent)
  }

  const pressed = (await toggle.getAttribute('aria-pressed')) === 'true'
  await expectFill(pressed)
  await toggle.click()
  await expectFill(!pressed)
  await toggle.click()
  await expectFill(pressed)
})

test('the checker keeps its footer while it leaves for another page', async ({
  page,
}) => {
  await open(page, '/check')
  await page.evaluate(() => window.scrollTo({ top: 1e6 }))
  // Note each moment when the checker is on the page without a footer.
  await page.evaluate(() => {
    const lost: Array<string> = []
    Object.assign(window, { __footerLost: lost })
    new MutationObserver(() => {
      const checker = document.querySelector('[aria-label="Assistant mode"]')
      if (checker && !document.querySelector('footer')) {
        lost.push(location.pathname)
      }
    }).observe(document.body, { childList: true, subtree: true })
  })
  await page
    .locator('footer')
    .getByRole('link', { name: 'Work', exact: true })
    .click()
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('main h1')).toHaveText('Built for the real world.')
  expect(
    await page.evaluate(
      () => (window as unknown as { __footerLost: Array<string> }).__footerLost,
    ),
  ).toEqual([])
})

test('the send button is concentric on one line and on the last of many', async ({
  page,
}) => {
  await open(page, '/chat')
  const field = composer(page)
  const gaps = () =>
    field.evaluate((textarea) => {
      const form = textarea.closest('form')!.getBoundingClientRect()
      const button = textarea
        .closest('form')!
        .querySelector('button')!
        .getBoundingClientRect()
      return {
        top: Math.round(button.top - form.top),
        bottom: Math.round(form.bottom - button.bottom),
        right: Math.round(form.right - button.right),
      }
    })
  const oneLine = await gaps()
  expect(oneLine.top).toBe(oneLine.bottom)
  expect(oneLine.right).toBe(oneLine.bottom)

  await field.fill('one\ntwo\nthree')
  const lines = await gaps()
  expect(lines.bottom).toBe(oneLine.bottom)
  expect(lines.top).toBeGreaterThan(lines.bottom)
})

test('a click anywhere on a collapsed source selects it, but not a link or a selection', async ({
  page,
}) => {
  const long = {
    id: 'S21',
    title: 'This portfolio as working samples',
    group: 'Projects',
    body: [
      'Ali built [the chat](https://example.com/chat) as a working sample.',
      'It streams answers with inline citations, and the server checks each citation before it sends it.',
      'Answers can be stopped, retried, and edited and sent again.',
      'A resizable, collapsible evidence panel shows the cited sources.',
      'The claim checker splits a claim into parts and grades each part.',
      'Each grade quotes the record, and the server checks every quote word for word.',
    ].join(' '),
  }
  await page
    .context()
    .route('https://example.com/**', (route) => route.fulfill({ body: 'ok' }))
  await mockAi(page, {
    '/api/chat': [
      { delay: 20, event: { type: 'source', source: long } },
      { delay: 20, event: { type: 'delta', text: 'Yes [S21].' } },
      { delay: 20, event: { type: 'done' } },
    ],
  })
  await open(page, '/chat')
  await composer(page).fill('Has Ali built streaming interfaces?')
  await page.keyboard.press('Enter')
  await expect(page.getByText(/done in/)).toBeVisible()

  if (!isDesktop(page)) {
    await page.getByRole('button', { name: /1 source: .* evidence/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
  const card = page.getByRole('article', { name: long.title })
  const text = card.locator('[id$="-body"]')
  const toggle = card.getByRole('button', { name: 'Show more' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  // A link opens its page and leaves the card collapsed.
  const popup = page.waitForEvent('popup')
  await card.getByRole('link', { name: /the chat/ }).click()
  await (await popup).close()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  // A drag that selects text leaves the card collapsed.
  const box = (await text.boundingBox())!
  const y = box.y + box.height - 8
  await page.mouse.move(box.x + 4, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, y, { steps: 5 })
  await page.mouse.up()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await page.evaluate(() => window.getSelection()?.removeAllRanges())

  // A click on the card, also on its padding at the edge, expands the card
  // and selects its source, as a citation does. Show less clears the
  // selection.
  const citation = page.locator(`[data-citation="${long.id}"]`).first()
  await expect(citation).toHaveAttribute('aria-pressed', 'false')
  await card.click({ position: { x: 4, y: 4 } })
  const less = card.getByRole('button', { name: 'Show less' })
  await expect(less).toHaveAttribute('aria-expanded', 'true')
  await expect(citation).toHaveAttribute('aria-pressed', 'true')
  await less.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(citation).toHaveAttribute('aria-pressed', 'false')
})

test('a second click on a selected citation clears it while its card shows', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/chat')
  await composer(page).fill('Has Ali built streaming interfaces?')
  await page.keyboard.press('Enter')
  await expect(page.getByText(/done in/)).toBeVisible()

  // Not by role: the open drawer hides the answer from the accessibility
  // tree.
  const chip = page.locator(`[data-citation="${SOURCES.whimcall.id}"]`)
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')

  if (isDesktop(page)) {
    // The card shows, so the second click clears the selection, and focus
    // stays on the citation.
    await chip.click()
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await expect(chip).toBeFocused()
  } else {
    // The drawer hid the citation. After it closes, a click shows the card
    // again and keeps the selection.
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await chip.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
  }
})
