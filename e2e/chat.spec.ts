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
