'use node'

import { v } from 'convex/values'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { Resend } from 'resend'
import { action } from './_generated/server'

const nullableString = v.union(v.string(), v.null())

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function clean(value: string | null, maxLength: number) {
  return value?.trim().slice(0, maxLength) || null
}

function getSignaturePayload(args: {
  conversationId: string
  firstQuestion: string
  metadata: {
    country: string | null
    region: string | null
    city: string | null
    browser: string | null
    operatingSystem: string | null
    device: string | null
  }
  sentAt: number
}) {
  return JSON.stringify([
    args.conversationId,
    args.firstQuestion,
    args.metadata.country,
    args.metadata.region,
    args.metadata.city,
    args.metadata.browser,
    args.metadata.operatingSystem,
    args.metadata.device,
    args.sentAt,
  ])
}

export const sendNewConversationNotification = action({
  args: {
    conversationId: v.string(),
    firstQuestion: v.string(),
    metadata: v.object({
      country: nullableString,
      region: nullableString,
      city: nullableString,
      browser: nullableString,
      operatingSystem: nullableString,
      device: nullableString,
    }),
    sentAt: v.number(),
    signature: v.string(),
  },
  handler: async (_ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    if (Math.abs(Date.now() - args.sentAt) > 5 * 60 * 1000) {
      throw new Error('Notification request expired')
    }

    const expectedSignature = createHmac('sha256', resendApiKey)
      .update(getSignaturePayload(args))
      .digest('hex')
    const hasValidSignature =
      /^[a-f0-9]{64}$/.test(args.signature) &&
      timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(args.signature),
      )

    if (!hasValidSignature) {
      throw new Error('Invalid notification signature')
    }

    const siteUrl = process.env.SITE_URL || 'https://aliabbas.dev'
    const conversationUrl = `${siteUrl}/admin/conversations`
    const question = args.firstQuestion.trim().slice(0, 1000)
    const location = [
      clean(args.metadata.city, 120),
      clean(args.metadata.region, 120),
      clean(args.metadata.country, 80),
    ]
      .filter(Boolean)
      .join(', ')
    const visitorDetails = [
      location || null,
      clean(args.metadata.device, 80),
      clean(args.metadata.browser, 80),
      clean(args.metadata.operatingSystem, 80),
    ].filter(Boolean)
    const detailText =
      visitorDetails.join(' · ') || 'No visitor details available'

    const result = await new Resend(resendApiKey).emails.send({
      from: 'Ali Abbas <noreply@mail.aliabbas.dev>',
      to: 'ali@aliabbas.dev',
      subject: 'New Ask AI conversation',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="margin: 0 0 24px; color: #171717;">
            Someone started an Ask AI conversation
          </h2>
          <p style="color: #525252; margin: 0 0 8px;">
            Their first question:
          </p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #171717; margin: 0; white-space: pre-wrap;">${escapeHtml(question)}</p>
          </div>
          <p style="color: #737373; font-size: 14px; margin: 0 0 24px;">
            ${escapeHtml(detailText)}
          </p>
          <a href="${conversationUrl}" style="display: inline-block; background: #171717; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View conversations
          </a>
          <p style="color: #a3a3a3; font-size: 12px; margin-top: 24px;">
            Conversation ${escapeHtml(args.conversationId.slice(0, 120))}
          </p>
        </div>
      `,
      text: `Someone started an Ask AI conversation.\n\nFirst question:\n${question}\n\n${detailText}\n\nView conversations: ${conversationUrl}`,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return { id: result.data.id }
  },
})
