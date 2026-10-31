import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'
import { MAX_CLAIM_LENGTH } from '~/lib/check/protocol'

export type CheckSearch = { claim?: string }

// The page is rendered by the layout in _assistant.tsx, which keeps chat and
// the claim checker mounted together.
export const Route = createFileRoute('/_assistant/check')({
  validateSearch: (search: Record<string, unknown>): CheckSearch =>
    typeof search.claim === 'string' && search.claim.trim()
      ? { claim: search.claim.slice(0, MAX_CLAIM_LENGTH) }
      : {},
  head: () =>
    pageHead({
      title: 'Check a Claim About Ali — Portfolio AI',
      description:
        'Paste a claim about Ali Abbas. The checker grades each part against his public record — verified, partly verified, not supported, contradicted or unknown — and quotes the evidence.',
      path: '/check',
    }),
  component: () => null,
})
