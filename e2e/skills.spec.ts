import { expect, isDesktop, open, test } from './fixtures'
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
      // Stop is disabled now: focus moves to the next action.
      await expect(
        example.getByRole('button', { name: 'Stream', exact: true }),
      ).toBeFocused()

      await example.getByRole('button', { name: 'Stream and fail' }).click()
      await expect(status).toHaveText(/^Failed\./, { timeout: 10_000 })
      await expect(
        example.locator('p:not([role=status])', {
          hasText: 'The connection failed.',
        }),
      ).toBeVisible()
    })

    test('arrow keys move the motion card between corners', async ({
      page,
    }) => {
      const example = skill(page, 'Motion and interaction')
      const status = example.getByRole('status')
      await example.getByRole('button', { name: /^Card/ }).focus()
      await expect(status).toHaveText('Card in the top left corner.')
      await page.keyboard.press('ArrowRight')
      await expect(status).toHaveText('Card in the top right corner.')
      await page.keyboard.press('ArrowDown')
      await expect(status).toHaveText('Card in the bottom right corner.')
      await page.keyboard.press('ArrowLeft')
      await expect(status).toHaveText('Card in the bottom left corner.')
    })

    test('a dragged card lands in a corner on release', async ({ page }) => {
      test.skip(!isDesktop(page), 'A drag needs a pointer.')
      const example = skill(page, 'Motion and interaction')
      const card = example.getByRole('button', { name: /^Card/ })
      await card.scrollIntoViewIfNeeded()
      const box = (await card.boundingBox())!
      const stage = (await card.locator('..').boundingBox())!
      // Drag the card past the middle of the stage, toward the lower right.
      // The release point alone is nearest that corner, so the result does
      // not depend on the speed that the test machine gives the drag.
      const fromX = box.x + box.width / 2
      const fromY = box.y + box.height / 2
      const toX = stage.x + stage.width * 0.65
      const toY = stage.y + stage.height * 0.7
      await page.mouse.move(fromX, fromY)
      await page.mouse.down()
      for (let step = 1; step <= 5; step++) {
        await page.mouse.move(
          fromX + ((toX - fromX) * step) / 5,
          fromY + ((toY - fromY) * step) / 5,
        )
      }
      await page.mouse.up()
      await expect(example.getByRole('status')).toHaveText(
        'Card in the bottom right corner.',
      )
    })

    test('the vitals example leaves the loading state', async ({ page }) => {
      const example = skill(page, 'Performance and accessibility')
      await example.scrollIntoViewIfNeeded()
      await expect(example.getByText('Loading')).toHaveCount(0)
    })
  })
}
