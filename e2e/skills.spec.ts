import { expect, open, test } from './fixtures'

test('each skill links to its proof', async ({ page }) => {
  await open(page, '/skills')
  const link = (name: string) => page.getByRole('link', { name })
  await expect(link('Force each state in the Lab')).toHaveAttribute(
    'href',
    '/lab',
  )
  await expect(link('Try the interactions')).toHaveAttribute(
    'href',
    '/lab?demo=fluid-resizer',
  )
  await expect(link('Read the design system')).toHaveAttribute(
    'href',
    '/design#rules',
  )
  await expect(link('See the measurements')).toHaveAttribute(
    'href',
    '/performance',
  )
})
