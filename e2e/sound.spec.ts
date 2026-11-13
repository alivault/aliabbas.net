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

test('a hover plays one sound, also while the pointer moves over the parts of a control', async ({
  page,
}) => {
  // Count hover sounds: the hover tone starts at 1320 Hz.
  await page.addInitScript(() => {
    const w = window as unknown as { hovers: number }
    w.hovers = 0
    // It is called with its AudioParam below.
    // eslint-disable-next-line typescript/unbound-method
    const set = AudioParam.prototype.setValueAtTime
    AudioParam.prototype.setValueAtTime = function (value, time) {
      if (value === 1320) w.hovers += 1
      return set.call(this, value, time)
    }
  })
  await open(page, '/skills')
  await page.getByRole('button', { name: 'Sound' }).click()
  const hovers = () =>
    page.evaluate(() => (window as unknown as { hovers: number }).hovers)
  await page.mouse.move(5, 500)
  const start = await hovers()
  for (const name of ['Index', 'Next music', 'Sound']) {
    const box = (await page.getByRole('button', { name }).boundingBox())!
    // Across the control, over its text or its icon and the space around.
    for (let x = box.x + 2; x < box.x + box.width - 2; x += 3) {
      await page.mouse.move(x, box.y + box.height / 2)
    }
    await page.mouse.move(5, 500)
    await page.waitForTimeout(80)
  }
  expect((await hovers()) - start).toBe(3)
})

test('the music buttons and the name in the header have sounds', async ({
  page,
}) => {
  await open(page, '/skills')
  await page.getByRole('button', { name: 'Sound' }).click()
  for (const name of ['Previous music', 'Next music']) {
    await expect(page.getByRole('button', { name })).not.toHaveAttribute(
      'data-sound',
      /none|hover/,
    )
  }
  await expect(page.getByRole('link', { name: 'Ali Abbas' })).toHaveAttribute(
    'data-sound',
    'hover',
  )
})
