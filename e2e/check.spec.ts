import { SOURCES, expect, mockAi, test, open } from './fixtures'
import type { Frame } from './fixtures'

const grade = (verdict: string, quote?: string) => ({
  verdict,
  reason: `Reason for ${verdict}.`,
  evidence: quote ? [{ sourceId: SOURCES.pico.id, quote }] : [],
  downgraded: false,
})

function checkStream(delay = 30): Array<Frame> {
  return [
    {
      delay,
      event: {
        type: 'parts',
        parts: [
          { id: 'p1', text: 'Ali built Pico' },
          { id: 'p2', text: 'in Rust' },
        ],
      },
    },
    { delay, event: { type: 'source', source: SOURCES.pico } },
    {
      delay,
      event: {
        type: 'grade',
        partId: 'p1',
        grade: grade('verified', 'agent runtime'),
      },
    },
    {
      delay,
      event: {
        type: 'grade',
        partId: 'p2',
        grade: grade('contradicted', 'One Node server'),
      },
    },
    { delay, event: { type: 'done' } },
  ]
}

test('a claim is split, graded part by part, and gets an overall grade', async ({
  page,
}) => {
  await mockAi(page, { '/api/check': checkStream() })
  await open(page, '/check')
  await page.getByRole('button', { name: 'Ali built Pico in Rust.' }).click()

  await expect(
    page.getByRole('heading', { name: 'Overall grade' }),
  ).toBeVisible()
  await expect(
    page.getByRole('status').filter({ hasText: /Check complete/ }),
  ).toHaveText(/Overall grade: Contradicted\./)
  await expect(page.getByText('Part 1: Ali built Pico')).toBeVisible()

  const show = page.getByRole('button', { name: /Show source/ }).first()
  await show.click()
  await expect(
    page.getByRole('button', { name: /Hide source/ }).first(),
  ).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('mark').first()).toBeVisible()
})

test('Esc stops the check and marks the parts not graded', async ({ page }) => {
  await mockAi(page, { '/api/check': checkStream(600) })
  await open(page, '/check')
  await page.getByRole('button', { name: 'Ali built Pico in Rust.' }).click()
  await expect(page.getByText('Part 2: in Rust')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Stopped').first()).toBeVisible()
})

test('a link with a claim runs the check at once', async ({ page }) => {
  await mockAi(page, { '/api/check': checkStream() })
  await open(page, '/check?claim=Ali%20built%20Pico%20in%20Rust.')
  await expect(
    page.getByRole('heading', { name: 'Overall grade' }),
  ).toBeVisible()
  const requests = await page.evaluate(
    () =>
      (
        window as unknown as {
          __aiRequests: Array<{ body: { claim: string } }>
        }
      ).__aiRequests,
  )
  expect(requests.map((request) => request.body.claim)).toEqual([
    'Ali built Pico in Rust.',
  ])
})
