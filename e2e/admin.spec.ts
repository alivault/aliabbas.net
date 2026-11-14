import { expect, open, test } from './fixtures'
import type { Page } from '@playwright/test'

const now = Date.UTC(2026, 10, 14, 12)

const summaries = [
  {
    id: 'c1',
    startedAt: now - 3_600_000,
    lastMessageAt: now - 3_000_000,
    lastStatus: 'complete',
    messageCount: 4,
    preview: 'Which roles is Ali looking for?',
    city: 'Toronto',
    region: 'Ontario',
    country: 'CA',
    browser: 'Chrome',
    operatingSystem: 'macOS',
    device: 'Desktop',
    userAgent: null,
  },
  {
    id: 'c2',
    startedAt: now - 86_400_000,
    lastMessageAt: now - 86_000_000,
    lastStatus: 'complete',
    messageCount: 2,
    preview: 'How does Pico survive a crash?',
    city: 'Berlin',
    region: null,
    country: 'DE',
    browser: 'Firefox',
    operatingSystem: 'Linux',
    device: 'Desktop',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Firefox/140.0',
  },
]

function conversation(id: string) {
  const summary = summaries.find((entry) => entry.id === id)!
  return {
    ...summary,
    messages: [
      {
        id: `${id}-1`,
        conversationId: id,
        role: 'user',
        content: summary.preview,
        createdAt: summary.startedAt,
        status: 'complete',
      },
      {
        id: `${id}-2`,
        conversationId: id,
        role: 'assistant',
        content:
          id === 'c1'
            ? 'Ali looks for **senior frontend** roles:\n\n- Interactive interfaces\n- Streaming interfaces'
            : 'Pico keeps each session in a journal, so it can replay it.',
        createdAt: summary.startedAt + 5000,
        status: 'complete',
      },
    ],
  }
}

/** The admin API, as an approved admin sees it. */
export async function mockAdmin(page: Page, deleted: Array<string> = []) {
  await page.route('**/api/admin/conversations**', async (route) => {
    const request = route.request()
    if (request.method() === 'DELETE') {
      deleted.push((request.postDataJSON() as { id: string }).id)
      return route.fulfill({ json: { ok: true } })
    }
    const id = new URL(request.url()).searchParams.get('id')
    if (id) return route.fulfill({ json: { conversation: conversation(id) } })
    return route.fulfill({
      json: {
        conversations: summaries.filter((entry) => !deleted.includes(entry.id)),
        admin: { email: 'ali@aliabbas.dev', name: 'Ali' },
      },
    })
  })
}

test('the admin lists the conversations and reads one', async ({ page }) => {
  await mockAdmin(page)
  await open(page, '/admin/conversations')
  await expect(
    page.getByRole('heading', { name: 'Conversations', level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('Signed in as ali@aliabbas.dev')).toBeVisible()
  const list = page.getByRole('region', { name: 'All conversations' })
  await expect(list.getByRole('listitem')).toHaveCount(2)

  // The newest opens first.
  const messages = page.getByRole('list', { name: 'Messages' })
  await expect(messages).toContainText('senior frontend')

  // Another one opens on a click, and the list marks it.
  const pico = list.getByRole('button', { name: /Pico survive a crash/ })
  await pico.click()
  await expect(messages).toContainText('journal')
  await expect(pico).toHaveAttribute('aria-current', 'true')
  await expect(
    page
      .getByRole('region', { name: 'Conversation', exact: true })
      .getByText('Berlin, DE'),
  ).toBeVisible()

  // The search keeps the matches only.
  await page.getByLabel('Search conversations').fill('toronto')
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await page.getByLabel('Search conversations').fill('nothing like this')
  await expect(list).toContainText('No conversation matches the search.')
})

test('the admin deletes a conversation', async ({ page }) => {
  const deleted: Array<string> = []
  await mockAdmin(page, deleted)
  await open(page, '/admin/conversations')
  const list = page.getByRole('region', { name: 'All conversations' })
  await expect(list.getByRole('listitem')).toHaveCount(2)
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Delete conversation' }).click()
  await expect(list.getByRole('listitem')).toHaveCount(1)
  expect(deleted).toEqual(['c1'])
})

test(
  'on a phone, the list and a conversation take turns',
  { tag: '@mobile' },
  async ({ page }) => {
    await mockAdmin(page)
    await open(page, '/admin/conversations')
    const list = page.getByRole('region', { name: 'All conversations' })
    const reading = page.getByRole('region', {
      name: 'Conversation',
      exact: true,
    })
    await expect(list).toBeVisible()
    if ((page.viewportSize()?.width ?? 0) >= 1024) return
    await expect(reading).toBeHidden()
    await list.getByRole('button', { name: /Pico survive a crash/ }).click()
    await expect(reading).toContainText('journal')
    await expect(list).toBeHidden()
    await page.getByRole('button', { name: 'All conversations' }).click()
    await expect(list).toBeVisible()
  },
)

test('without a session, the admin asks to sign in', async ({ page }) => {
  await page.route('**/api/admin/conversations**', (route) =>
    route.fulfill({
      status: 401,
      json: { error: 'Sign in to read the conversations.' },
    }),
  )
  await open(page, '/admin/conversations')
  await expect(
    page.getByText('Sign in to read the conversations.'),
  ).toBeVisible()
  await expect(page.getByPlaceholder('Email')).toBeVisible()
  await expect(page.getByPlaceholder('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Continue with GitHub' }),
  ).toBeVisible()
})
