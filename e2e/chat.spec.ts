import { SOURCES, chatAnswer, expect, mockAi, open, test } from './fixtures'
import type { Frame } from './fixtures'
import type { Page } from '@playwright/test'

const ask = async (page: Page, question: string) => {
  await page.getByLabel('Ask about Ali').fill(question)
  await page.keyboard.press('Enter')
}

/** The last question and its answer. */
const lastTurn = (page: Page) => page.locator('[data-turn]').last()

const done = (page: Page) => expect(page.getByText(/done in/)).toBeVisible()

test(
  'an answer streams with citation chips, and lists its sources',
  { tag: '@mobile' },
  async ({ page }) => {
    await mockAi(page, { '/api/chat': chatAnswer() })
    await open(page, '/ai')
    await ask(page, 'Has Ali built streaming interfaces?')

    const answer = lastTurn(page)
    await expect(answer.getByRole('heading', { level: 2 })).toHaveText(
      'Has Ali built streaming interfaces?',
    )
    await expect(answer).toContainText('which both stream answers.')
    await done(page)
    await expect(
      answer.getByRole('button', { name: `Source 1: ${SOURCES.pico.title}` }),
    ).toBeVisible()
    // The evidence opens beside the answer on a wide screen; on a phone,
    // with the sources button.
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      await answer.getByRole('button', { name: '2 sources' }).click()
    }
    const sources = page.getByLabel('Evidence').getByRole('list', {
      name: 'Sources',
    })
    await expect(sources.getByText(SOURCES.whimcall.title)).toBeVisible()
    await expect(sources.getByText(SOURCES.pico.title)).toBeVisible()
    await expect(page.getByLabel('Ask about Ali')).toHaveValue('')
  },
)

test('a chip opens its source, and a second click closes it', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/ai')
  await ask(page, 'Has Ali built streaming interfaces?')
  await done(page)

  const chip = page.locator(`[data-citation="${SOURCES.whimcall.id}"]`)
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  const card = page.locator(':focus')
  await expect(card).toContainText(SOURCES.whimcall.title)
  await expect(card).toBeInViewport({ ratio: 0.5 })

  // Esc in the source goes back to the chip, and the reader stays open.
  await page.keyboard.press('Escape')
  await expect(chip).toBeFocused()
  await page.waitForTimeout(100)
  await expect(page).toHaveURL(/\/ai$/)

  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'false')
})

test('Esc stops the answer, keeps its text, and offers Retry', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer(250) })
  await open(page, '/ai')
  await ask(page, 'Has Ali built streaming interfaces?')

  const answer = lastTurn(page)
  await expect(answer).toContainText('Yes. Ali built')
  await page.keyboard.press('Escape')
  await expect(answer.getByText('Stopped', { exact: true })).toBeVisible()
  // The Esc stopped the answer; it did not leave the page.
  await expect(page).toHaveURL(/\/ai$/)
  const text = await answer.innerText()
  await page.waitForTimeout(800)
  expect(await answer.innerText()).toBe(text)
  await expect(answer.getByRole('button', { name: 'Retry' })).toBeVisible()
  await expect(
    answer.getByRole('button', { name: 'Edit question' }),
  ).toBeVisible()
})

test('Stop under the answer ends it', async ({ page }) => {
  await mockAi(page, { '/api/chat': chatAnswer(250) })
  await open(page, '/ai')
  await ask(page, 'Has Ali built streaming interfaces?')
  const answer = lastTurn(page)
  await expect(answer).toContainText('Yes. Ali built')
  await answer.getByRole('button', { name: 'Stop', exact: true }).click()
  await expect(answer.getByText('Stopped', { exact: true })).toBeVisible()
})

test('Regenerate sends the question again as a new attempt', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/ai')
  await ask(page, 'Which project is the strongest?')
  await done(page)
  await page.getByRole('button', { name: 'Regenerate' }).click()
  await done(page)

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
  await expect(page.locator('[data-turn]')).toHaveCount(1)
})

test('a link to this site opens the page in the app, and the chat stays', async ({
  page,
}) => {
  const frames: Array<Frame> = [
    { delay: 20, event: { type: 'source', source: SOURCES.pico } },
    {
      delay: 20,
      event: {
        type: 'delta',
        text: 'Read [the Pico case study](https://aliabbas.net/work/pico) [S19].',
      },
    },
    { delay: 20, event: { type: 'done' } },
  ]
  await mockAi(page, { '/api/chat': frames })
  await open(page, '/ai')
  await ask(page, 'What is Pico?')
  await done(page)

  const link = page.getByRole('link', { name: 'the Pico case study' })
  await expect(link).toHaveAttribute('href', '/work/pico')
  await expect(link).not.toHaveAttribute('target')
  // A full page load would reset this mark.
  await page.evaluate(() => Object.assign(window, { __samePage: true }))
  await link.click()
  await expect(page).toHaveURL(/\/work\/pico$/)
  expect(await page.evaluate(() => '__samePage' in window)).toBe(true)

  await page.goBack()
  await expect(page).toHaveURL(/\/ai$/)
  await expect(page.locator('[data-turn]')).toContainText('the Pico case study')
})

test('a starter question asks at once', async ({ page }) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/ai')
  await page.getByRole('button', { name: 'What does Ali build?' }).click()
  await expect(lastTurn(page).getByRole('heading', { level: 2 })).toHaveText(
    'What does Ali build?',
  )
  await done(page)
  // The question asked leaves the starters; the others stay to try.
  await expect(
    page.getByRole('button', { name: 'What does Ali build?' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'How does Pico survive a crash?' }),
  ).toBeVisible()
})

test('Shift+Enter adds a line, and Enter sends', async ({ page }) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/ai')
  const field = page.getByLabel('Ask about Ali')
  await field.fill('one')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('two')
  await expect(field).toHaveValue('one\ntwo')
  await page.keyboard.press('Enter')
  await expect(field).toHaveValue('')
  await expect(page.locator('[data-turn]')).toHaveCount(1)
})

test(
  'the field stays at the bottom of the screen, also after a scroll',
  { tag: '@mobile' },
  async ({ page }) => {
    await mockAi(page, { '/api/chat': chatAnswer() })
    await open(page, '/ai')
    const field = page.getByLabel('Ask about Ali')
    const bottomGap = () =>
      field.evaluate(
        (element) => innerHeight - element.getBoundingClientRect().bottom,
      )
    expect(await bottomGap()).toBeLessThan(60)
    await ask(page, 'Has Ali built streaming interfaces?')
    await done(page)
    await page.evaluate(() => window.scrollTo({ top: 0 }))
    expect(await bottomGap()).toBeLessThan(60)
  },
)

test('the evidence sidebar closes, and the sources button opens it again', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/ai')
  await ask(page, 'Has Ali built streaming interfaces?')
  await done(page)
  const evidence = page.getByLabel('Evidence')
  // A wide screen opens it with the first sources.
  await expect(evidence).toBeVisible()
  await evidence.getByRole('button', { name: 'Close' }).click()
  await expect(evidence).toHaveCount(0)
  const toggle = lastTurn(page).getByRole('button', { name: '2 sources' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(evidence).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
})

test('on an ultrawide screen, the page and the evidence stay in the middle frame', async ({
  page,
}) => {
  await page.setViewportSize({ width: 3440, height: 1440 })
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/ai')
  await ask(page, 'Has Ali built streaming interfaces?')
  await done(page)
  // The frame is 1920px wide: 760px on each side of it.
  const title = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(title?.x).toBeGreaterThanOrEqual(760)
  const panel = await page.getByLabel('Evidence').boundingBox()
  expect((panel?.x ?? 0) + (panel?.width ?? 0)).toBeLessThanOrEqual(3440 - 760)
  // It is beside the text, not at the far side of the frame.
  const answer = await lastTurn(page).locator('p').first().boundingBox()
  const gap = (panel?.x ?? 0) - ((answer?.x ?? 0) + (answer?.width ?? 0))
  expect(gap).toBeGreaterThan(0)
  expect(gap).toBeLessThan(200)
  // It floats: clear of the top and the bottom of the screen.
  expect(panel?.y).toBeGreaterThan(0)
  expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeLessThan(1440)
})
