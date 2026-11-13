import { expect, open, test } from './fixtures'

const NOTE = '/notes/enhance-your-lazygit-experience-with-git-delta-integration'

test(
  'a note reads as a reader, with no footer',
  { tag: '@mobile' },
  async ({ page }) => {
    await open(page, NOTE)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Lazygit/i)
    // The parts of the note are h2 in the HUD face, and the code is mono.
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
    await expect(page.locator('pre').first()).toContainText('delta')
    await expect(page.locator('footer')).toHaveCount(0)
    // A picture opens in the zoom view.
    await page
      .getByRole('button', { name: /^Zoom:/ })
      .first()
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Zoomed media' }),
    ).toBeVisible()
  },
)

test('the comments sign in by GitHub or by email', async ({ page }) => {
  await open(page, NOTE)
  const comments = page.getByRole('heading', { name: /^Comments/ })
  await comments.scrollIntoViewIfNeeded()
  await expect(
    page.getByRole('button', { name: 'Sign in with GitHub' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sign in with email' }).click()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await page.getByRole('button', { name: 'Create an account' }).click()
  await expect(page.getByLabel('Name (optional)')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(
    page.getByRole('button', { name: 'Sign in with GitHub' }),
  ).toBeVisible()
})

test('All notes goes back to the list', async ({ page }) => {
  await open(page, NOTE)
  await page.getByRole('link', { name: 'All notes' }).click()
  await expect(page).toHaveURL(/\/notes$/)
})
