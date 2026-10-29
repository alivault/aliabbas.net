import { validateGrade } from './evidence'
import { overallVerdict } from './verdicts'
import { describe, expect, it } from 'vite-plus/test'

const sources = new Map([
  [
    'S19',
    {
      id: 'S19',
      title: 'Pico — local-first developer tool (2026)',
      body: 'One Node server hosts the agent runtime and serves the React web app.',
    },
  ],
])

describe('validateGrade', () => {
  it('keeps a grade whose quote is in its source', () => {
    const grade = validateGrade(
      {
        verdict: 'contradicted',
        reason: 'Node, not Rust.',
        evidence: [
          { source: 'S19', quote: 'One Node server hosts the agent runtime' },
        ],
      },
      sources,
    )
    expect(grade).toMatchObject({ verdict: 'contradicted', downgraded: false })
    expect(grade.evidence).toHaveLength(1)
  })

  it('downgrades to unknown when a quote is not in its source', () => {
    const grade = validateGrade(
      {
        verdict: 'verified',
        reason: 'x',
        evidence: [{ source: 'S19', quote: 'Pico is written in Rust' }],
      },
      sources,
    )
    expect(grade).toMatchObject({
      verdict: 'unknown',
      downgraded: true,
      evidence: [],
    })
  })

  it('drops quotes from unknown sources and a bad verdict', () => {
    const grade = validateGrade(
      { verdict: 'maybe', evidence: [{ source: 'S99', quote: 'anything' }] },
      sources,
    )
    expect(grade).toMatchObject({ verdict: 'unknown', evidence: [] })
  })
})

describe('overallVerdict', () => {
  it('follows the order of the rules', () => {
    expect(overallVerdict([])).toBe('unknown')
    expect(overallVerdict(['verified', 'contradicted'])).toBe('contradicted')
    expect(overallVerdict(['verified', 'verified'])).toBe('verified')
    expect(overallVerdict(['verified', 'unknown'])).toBe('partly_verified')
    expect(overallVerdict(['not_supported', 'unknown'])).toBe('not_supported')
    expect(overallVerdict(['unknown'])).toBe('unknown')
  })
})
