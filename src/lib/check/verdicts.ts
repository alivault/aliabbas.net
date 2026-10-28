/**
 * The five grades of the claim checker. A grade is a statement about the
 * public record, not about the truth: "not supported" means that the record
 * covers the topic and does not show the claim, and "unknown" means that the
 * record does not cover it at all.
 */
export const VERDICTS = [
  'verified',
  'partly_verified',
  'not_supported',
  'contradicted',
  'unknown',
] as const

export type Verdict = (typeof VERDICTS)[number]

export function isVerdict(value: unknown): value is Verdict {
  return typeof value === 'string' && VERDICTS.includes(value as Verdict)
}

export const VERDICT_INFO: Record<
  Verdict,
  { label: string; description: string }
> = {
  verified: {
    label: 'Verified',
    description: 'The sources state this.',
  },
  partly_verified: {
    label: 'Partly verified',
    description: 'The sources support part of this, but not all of it.',
  },
  not_supported: {
    label: 'Not supported',
    description: 'The sources cover this topic, but they do not show this.',
  },
  contradicted: {
    label: 'Contradicted',
    description: 'The sources state something different.',
  },
  unknown: {
    label: 'Unknown',
    description: 'The public record does not cover this.',
  },
}

/** Grades that must rest on at least one quote from the sources. */
export function needsEvidence(verdict: Verdict) {
  return (
    verdict === 'verified' ||
    verdict === 'partly_verified' ||
    verdict === 'contradicted'
  )
}

/**
 * The grade of the whole claim, from the grades of its parts. One
 * contradicted part makes the claim contradicted. All parts must be verified
 * for the claim to be verified. Some support makes it partly verified.
 */
export function overallVerdict(verdicts: ReadonlyArray<Verdict>): Verdict {
  if (verdicts.length === 0) return 'unknown'
  if (verdicts.includes('contradicted')) return 'contradicted'
  if (verdicts.every((verdict) => verdict === 'verified')) return 'verified'
  if (
    verdicts.some(
      (verdict) => verdict === 'verified' || verdict === 'partly_verified',
    )
  ) {
    return 'partly_verified'
  }
  if (verdicts.includes('not_supported')) return 'not_supported'
  return 'unknown'
}
