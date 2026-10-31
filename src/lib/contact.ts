/** Shared by the contact form and its server function (src/lib/email.ts). */

export const CONTACT_TOPICS = [
  'Full-time role',
  'Contract',
  'Collaboration',
  'Just saying hi',
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]

export const MAX_MESSAGE_LENGTH = 2000

/** The error message when the human check fails, so the form can say so. */
export const HUMAN_CHECK_FAILED = 'human-check-failed'
