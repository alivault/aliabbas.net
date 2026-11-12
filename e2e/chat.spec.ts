import { SOURCES, chatAnswer, expect, mockAi, open, test } from './fixtures'
import type { Page } from '@playwright/test'

const ask = async (page: Page, question: string) => {
  await page.getByLabel('Ask about Ali').fill(question)
  await page.keyboard.press('Enter')
}

test(
  'an answer streams and lists its sources',
  { tag: '@mobile' },
  async ({ page }) => {
    await mockAi(page, { '/api/chat': chatAnswer() })
    await open(page, '/chat')
    await ask(page, 'Has Ali built streaming interfaces?')

    const answer = page.getByRole('article').last()
    await expect(answer.getByRole('heading')).toHaveText(
      'Has Ali built streaming interfaces?',
    )
    await expect(answer).toContainText('which both stream answers.')
    // The citations become numbers, and the sources show under the answer.
    await expect(answer.getByText(SOURCES.whimcall.title)).toBeVisible()
    await expect(answer.getByText(SOURCES.pico.title)).toBeVisible()
    await expect(page.getByLabel('Ask about Ali')).toHaveValue('')
  },
)

test('Stop ends the answer and keeps the text that arrived', async ({
  page,
}) => {
  await mockAi(page, { '/api/chat': chatAnswer(250) })
  await open(page, '/chat')
  await ask(page, 'Has Ali built streaming interfaces?')

  const answer = page.getByRole('article').last()
  await expect(answer).toContainText('Ali built')
  await answer.getByRole('button', { name: 'Stop' }).click()
  await expect(answer.getByRole('button', { name: 'Stop' })).toHaveCount(0)
  const text = await answer.innerText()
  await page.waitForTimeout(800)
  expect(await answer.innerText()).toBe(text)
  expect(text).not.toContain('which both stream answers.')
})

test('a starter question asks at once', async ({ page }) => {
  await mockAi(page, { '/api/chat': chatAnswer() })
  await open(page, '/chat')
  await page.getByRole('button', { name: 'What does Ali build?' }).click()
  await expect(
    page.getByRole('article').last().getByRole('heading'),
  ).toHaveText('What does Ali build?')
  // The starters go away after the first question.
  await expect(
    page.getByRole('button', { name: 'How does Pico survive a crash?' }),
  ).toHaveCount(0)
})
