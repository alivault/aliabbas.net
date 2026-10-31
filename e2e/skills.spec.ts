import { expect, test, open } from './fixtures'
import type { Page } from '@playwright/test'

function skill(page: Page, title: string) {
  return page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: title }) })
}

for (const path of ['/', '/skills']) {
  test.describe(`skills on ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, path)
    })

    test('each skill links to its proof', async ({ page }) => {
      await expect(
        skill(page, 'Streaming state').getByRole('link', {
          name: 'Force each state in the Lab',
        }),
      ).toHaveAttribute('href', '/lab#streaming-list')
      await expect(
        skill(page, 'Motion and interaction').getByRole('link', {
          name: 'Try the interactions',
        }),
      ).toHaveAttribute('href', '/lab#fluid-resizer')
      await expect(
        skill(page, 'Design systems').getByRole('link', {
          name: 'Read the design system',
        }),
      ).toHaveAttribute('href', '/design#rules')
      await expect(
        skill(page, 'Performance and accessibility').getByRole('link', {
          name: 'See the measurements',
        }),
      ).toHaveAttribute('href', '/performance')
    })

    test('the stream starts, Esc stops it, and a failed stream says so', async ({
      page,
    }) => {
      const example = skill(page, 'Streaming state')
      const status = example.getByRole('status')
      await expect(status).toHaveText(/^Idle\./)

      await example.getByRole('button', { name: 'Stream', exact: true }).click()
      await expect(example.getByRole('button', { name: 'Stop' })).toBeFocused()
      await expect(status).toHaveText(/^(Loading|Streaming)\./)
      await page.keyboard.press('Escape')
      await expect(status).toHaveText(/^Stopped\./)
      await expect(
        example.locator('p:not([role=status])', { hasText: 'Stopped.' }),
      ).toBeVisible()

      await example.getByRole('button', { name: 'Stream and fail' }).click()
      await expect(status).toHaveText(/^Failed\./, { timeout: 10_000 })
      await expect(
        example.locator('p:not([role=status])', {
          hasText: 'The connection failed.',
        }),
      ).toBeVisible()
    })

    test('arrow keys move between the motion tabs', async ({ page }) => {
      const example = skill(page, 'Motion and interaction')
      await example.getByRole('tab', { name: 'Answer' }).click()
      await page.keyboard.press('ArrowRight')
      const sources = example.getByRole('tab', { name: 'Sources' })
      await expect(sources).toBeFocused()
      await expect(sources).toHaveAttribute('aria-selected', 'true')
      await expect(example.getByRole('tabpanel')).toHaveText(/keeps its place/)
      await page.keyboard.press('End')
      await expect(example.getByRole('tab', { name: 'Notes' })).toBeFocused()
      await page.keyboard.press('ArrowRight')
      await expect(example.getByRole('tab', { name: 'Answer' })).toBeFocused()
    })

    test('the vitals example leaves the loading state', async ({ page }) => {
      const example = skill(page, 'Performance and accessibility')
      await example.scrollIntoViewIfNeeded()
      await expect(example.getByText('Loading')).toHaveCount(0)
    })
  })
}
