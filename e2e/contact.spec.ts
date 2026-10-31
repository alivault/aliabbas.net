import { expect, test, open } from './fixtures'

// The dev server uses the Turnstile test site key from .env.development,
// which always passes, so the form gets a token with no click.

test('an empty send shows an error under each required field', async ({
  page,
}) => {
  await open(page, '/contact')
  const form = page.getByRole('form', { name: 'Contact' })
  await form.getByRole('button', { name: 'Send message' }).click()

  await expect(form.getByText('Enter your name.')).toBeVisible()
  await expect(form.getByText('Enter a valid email address.')).toBeVisible()
  await expect(form.getByText('Enter a message.')).toBeVisible()
  await expect(form.getByLabel('Name')).toBeFocused()
})

test('a topic chip toggles, and the message shows its length', async ({
  page,
}) => {
  await open(page, '/contact')
  const form = page.getByRole('form', { name: 'Contact' })
  const contract = form.getByRole('button', { name: 'Contract' })
  const fullTime = form.getByRole('button', { name: 'Full-time role' })

  await contract.click()
  await expect(contract).toHaveAttribute('aria-pressed', 'true')
  await fullTime.click()
  await expect(fullTime).toHaveAttribute('aria-pressed', 'true')
  await expect(contract).toHaveAttribute('aria-pressed', 'false')
  await fullTime.click()
  await expect(fullTime).toHaveAttribute('aria-pressed', 'false')

  await form.getByLabel('Message').fill('Hello')
  await expect(form.getByText('5 / 2000')).toBeVisible()
})

test('a failed send keeps the message and gives the email address', async ({
  page,
}) => {
  await page.route('**/_serverFn/**', (route) => route.abort())
  await open(page, '/contact')
  const form = page.getByRole('form', { name: 'Contact' })
  await form.getByLabel('Name').fill('Ada Lovelace')
  await form.getByLabel('Email').fill('ada@example.com')
  await form.getByLabel('Message').fill('A role on the engine team.')
  // Send when Turnstile has its token, so the aborted request is the error.
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLInputElement>('[name=cf-turnstile-response]')
        ?.value,
    null,
    { timeout: 20_000 },
  )
  await form.getByRole('button', { name: 'Send message' }).click()

  await expect(form.getByRole('alert')).toContainText(
    'Your message was not sent. Try again, or write to ali@aliabbas.net.',
  )
  await expect(form.getByLabel('Message')).toHaveValue(
    'A role on the engine team.',
  )
})

test('the page gives other ways to get in touch', async ({ page }) => {
  await open(page, '/contact')
  await expect(
    page.getByRole('link', { name: 'ali@aliabbas.net' }),
  ).toHaveAttribute('href', 'mailto:ali@aliabbas.net')
  await expect(page.getByRole('link', { name: /^LinkedIn/ })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/webdevali',
  )
  await expect(
    page.getByRole('link', { name: 'Ask AI about me first' }),
  ).toHaveAttribute('href', '/chat')
})
