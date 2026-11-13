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
  'the sound buttons are at the top, left of Index',
  { tag: '@mobile' },
  async ({ page }) => {
    await open(page, '/skills')
    await page.getByRole('button', { name: 'Sound' }).click()
    const next = await page
      .getByRole('button', { name: 'Next music' })
      .boundingBox()
    const index = await page
      .getByRole('button', { name: 'Index' })
      .boundingBox()
    expect(next!.x + next!.width).toBeLessThan(index!.x)
    // The label of Index changes, and the buttons at its left stay.
    const sound = page.getByRole('button', { name: 'Sound' })
    const before = (await sound.boundingBox())!.x
    await page.getByRole('button', { name: 'Index' }).click()
    await expect(page.getByRole('button', { name: 'Return' })).toBeVisible()
    expect((await sound.boundingBox())!.x).toBe(before)
    expect(
      Math.abs(next!.y + next!.height / 2 - (index!.y + index!.height / 2)),
    ).toBeLessThan(4)
  },
)
