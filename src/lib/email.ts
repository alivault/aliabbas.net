import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { Resend } from 'resend'
import { z } from 'zod'
import {
  CONTACT_TOPICS,
  HUMAN_CHECK_FAILED,
  MAX_MESSAGE_LENGTH,
} from './contact'

const contactInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  topic: z.enum(CONTACT_TOPICS).optional(),
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  token: z.string().min(1).max(2048),
})

export type ContactInput = z.infer<typeof contactInput>

/** The action of the contact form widget (see src/lib/turnstile.ts). */
const TURNSTILE_ACTION = 'contact'

type SiteverifyResult = {
  success?: boolean
  action?: string
  hostname?: string
  metadata?: { result_with_testing_key?: boolean }
}

/**
 * Asks Cloudflare if the Turnstile token is valid, for this form and this
 * site. TURNSTILE_HOSTNAMES lists the hostnames of this deployment.
 */
async function verifyTurnstile(token: string) {
  const secret = env.TURNSTILE_SECRET_KEY
  const hostnames = new Set(
    (env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  )
  if (!secret || hostnames.size === 0) return false

  let result: SiteverifyResult
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: getRequestHeader('cf-connecting-ip') ?? '',
        }),
      },
    )
    if (!response.ok) return false
    result = await response.json()
  } catch {
    return false
  }

  // The test secret of local development returns no action.
  const actionMatches =
    result.action === TURNSTILE_ACTION ||
    result.metadata?.result_with_testing_key === true
  return (
    result.success === true &&
    actionMatches &&
    hostnames.has(result.hostname ?? '')
  )
}

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const sendContactEmail = createServerFn({ method: 'POST' })
  .validator((data: ContactInput) => contactInput.parse(data))
  .handler(async ({ data }) => {
    const { name, email, topic, message, token } = data

    if (!(await verifyTurnstile(token))) {
      throw new Error(HUMAN_CHECK_FAILED)
    }

    const resend = new Resend(env.RESEND_API_KEY)
    const subject = topic ? `${topic}, from ${name}` : `from ${name}`
    const result = await resend.emails.send({
      from: 'New Message <form@mail.aliabbas.net>',
      to: ['ali@aliabbas.net'],
      replyTo: email,
      subject,
      html: `
        <div>
          ${topic ? `<p><strong>${escapeHtml(topic)}</strong></p>` : ''}
          <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
          <p><strong>${escapeHtml(name)}</strong><br>${escapeHtml(email)}</p>
        </div>
      `,
      text: `${topic ? `${topic}\n\n` : ''}${message}\n\n${name} (${email})`,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return { success: true, id: result.data.id }
  })
