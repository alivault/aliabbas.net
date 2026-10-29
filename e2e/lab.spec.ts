import { expect, isDesktop, test, open } from './fixtures'

const SCENARIOS: Array<[string, RegExp]> = [
  ['Idle', /^Idle\./],
  ['Loading', /^Loading\./],
  ['Slow', /^(Loading|Streaming|Done)\./],
  ['Streaming', /^(Streaming|Done)\./],
  ['Interrupted', /^Stopped\./],
  ['Error', /^Failed\./],
  ['Done', /^Done\./],
]

test.beforeEach(async ({ page }) => {
  await open(page, '/lab')
})

test.describe('streaming list', () => {
  test('every forced state reaches its machine state', async ({ page }) => {
    const specimen = page.locator('#streaming-list')
    const status = specimen.getByRole('status')
    for (const [label, state] of SCENARIOS) {
      await specimen.getByRole('radio', { name: label, exact: true }).click()
      await expect(
        specimen.getByRole('radio', { name: label, exact: true }),
      ).toHaveAttribute('aria-checked', 'true')
      await expect(status).toHaveText(state)
    }
  })

  test('arrow keys move through the states, and Tab leaves the group', async ({
    page,
  }) => {
    const specimen = page.locator('#streaming-list')
    await specimen.getByRole('radio', { name: 'Idle', exact: true }).click()
    await page.keyboard.press('ArrowRight')
    await expect(specimen.getByRole('radio', { name: 'Loading' })).toBeFocused()
    await expect(
      specimen.getByRole('radio', { name: 'Loading' }),
    ).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('End')
    await expect(specimen.getByRole('radio', { name: 'Done' })).toBeFocused()
    await page.keyboard.press('Home')
    await expect(specimen.getByRole('radio', { name: 'Idle' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      specimen.getByRole('radio', { name: 'Idle' }),
    ).not.toBeFocused()
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('role')),
    ).not.toBe('radio')
  })

  test('Esc stops a slow stream and keeps the text', async ({ page }) => {
    const specimen = page.locator('#streaming-list')
    await specimen.getByRole('radio', { name: 'Slow' }).click()
    await expect(specimen.getByRole('status')).toHaveText(/^Streaming\./, {
      timeout: 10_000,
    })
    await page.keyboard.press('Escape')
    await expect(specimen.getByRole('status')).toHaveText(/^Stopped\./)
    await expect(specimen.locator('article')).not.toBeEmpty()
  })

  test('Enter on a citation chip moves focus to its source', async ({
    page,
  }) => {
    test.skip(!isDesktop(page), 'On a phone, a chip opens the drawer.')
    const specimen = page.locator('#streaming-list')
    await specimen.getByRole('radio', { name: 'Done' }).click()
    const chip = specimen
      .locator('article button')
      .filter({ hasText: /^2$/ })
      .first()
    await chip.focus()
    await page.keyboard.press('Enter')
    const focused = page.locator(':focus')
    await expect(focused).not.toHaveText('2')
    await expect(focused).toBeInViewport()
  })
})

test('citation drawer opens, closes with Esc, and returns focus', async ({
  page,
}) => {
  const specimen = page.locator('#citation-drawer')
  await specimen.scrollIntoViewIfNeeded()
  const chip = specimen.locator('button').filter({ hasText: /^3$/ }).first()
  await chip.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  // The chosen source has focus and is in the visible part of the drawer.
  const card = page.locator(':focus')
  await expect(card).toBeInViewport({ ratio: 0.5 })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(chip).toBeFocused()
})

test('resizer: drag and keyboard both change the panel width', async ({
  page,
}) => {
  test.skip(!isDesktop(page), 'The resizer is a desktop layout.')
  const specimen = page.locator('#fluid-resizer')
  await specimen.scrollIntoViewIfNeeded()
  const handle = specimen.getByRole('separator').first()
  const value = async () => Number(await handle.getAttribute('aria-valuenow'))

  const box = await handle.boundingBox()
  if (!box) throw new Error('The resize handle has no box.')
  const start = await value()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x - 120, box.y + box.height / 2, { steps: 12 })
  await page.mouse.up()
  const dragged = await value()
  expect(dragged).not.toBe(start)

  await handle.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(value).not.toBe(dragged)
})

test('moving the card keeps its state', async ({ page }) => {
  const specimen = page.locator('#state-transition')
  await specimen.scrollIntoViewIfNeeded()
  const note = specimen.getByLabel('Your note')
  await note.click()
  await page.keyboard.type('hello')
  await specimen.getByRole('radio', { name: 'Dock' }).click()
  await expect(specimen.getByLabel('Your note')).toHaveValue('hello')
  await expect(specimen.getByText(/Mounted 1 time/)).toBeVisible()
})
