import { expect, open, test } from './fixtures'

const label = (page: import('@playwright/test').Page) =>
  page.locator('[aria-live="polite"]').filter({ hasText: 'Music' })

test('with sound on, Previous and Next change the music, and the choice stays', async ({
  page,
}) => {
  await open(page, '/skills')
  const next = page.getByRole('button', { name: 'Next music' })
  await expect(next).toHaveCount(0)
  await page.getByRole('button', { name: 'Sound' }).click()
  await expect(label(page)).toHaveText('Music: Tide 1/5')
  await next.click()
  await expect(label(page)).toHaveText('Music: Dusk 2/5')
  await page.getByRole('button', { name: 'Previous music' }).click()
  await page.getByRole('button', { name: 'Previous music' }).click()
  await expect(label(page)).toHaveText('Music: Signal 5/5')
  // The saved choice is on: the first key starts the sound again.
  await open(page, '/skills')
  await page.keyboard.press('Shift')
  await expect(label(page)).toHaveText('Music: Signal 5/5')
})

test(
  'the chat field stays clear of the music buttons',
  { tag: '@mobile' },
  async ({ page }) => {
    await open(page, '/ai')
    await page.getByRole('button', { name: 'Sound' }).click()
    const next = await page
      .getByRole('button', { name: 'Next music' })
      .boundingBox()
    const field = await page.getByLabel('Ask about Ali').boundingBox()
    expect(field!.x).toBeGreaterThan(next!.x + next!.width)
  },
)
