import { useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import ClaimChecker from '~/components/check/ClaimChecker'
import Main from '~/components/Main'
import { MAX_CLAIM_LENGTH } from '~/lib/check/protocol'

type CheckSearch = { claim?: string }

export const Route = createFileRoute('/check')({
  validateSearch: (search: Record<string, unknown>): CheckSearch =>
    typeof search.claim === 'string' && search.claim.trim()
      ? { claim: search.claim.slice(0, MAX_CLAIM_LENGTH) }
      : {},
  head: () => ({
    meta: [
      { title: 'Check a Claim About Ali — Portfolio AI' },
      {
        name: 'description',
        content:
          'Paste a claim about Ali Abbas. The checker grades each part against his public record — verified, partly verified, not supported, contradicted or unknown — and quotes the evidence.',
      },
    ],
  }),
  component: CheckPage,
})

function CheckPage() {
  const { claim } = Route.useSearch()
  const navigate = useNavigate({ from: '/check' })
  // Keep the current claim in the URL, so a result can be shared.
  const setClaim = useCallback(
    (next: string | undefined) => {
      void navigate({ search: next ? { claim: next } : {}, replace: true })
    },
    [navigate],
  )

  return (
    <Main>
      <section className="site-noise bg-background text-foreground">
        <div className="relative z-30">
          <ClaimChecker initialClaim={claim} onClaimChange={setClaim} />
        </div>
      </section>
    </Main>
  )
}
