import type { ChatSource } from '~/lib/chat/protocol'
import { isVerdict, needsEvidence } from './verdicts'
import type { Verdict } from './verdicts'

export type EvidenceQuote = { sourceId: string; quote: string }

export type Grade = {
  verdict: Verdict
  reason: string
  evidence: Array<EvidenceQuote>
  /** True when the server changed the model's grade because its quotes did not match. */
  downgraded: boolean
}

/** Compare text without case, markdown emphasis, quote style or line breaks. */
export function normalizeForMatch(text: string) {
  return text
    .replace(/[*_`]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:]+$/, '')
    .toLowerCase()
}

export function quoteIsInSource(quote: string, sourceBody: string) {
  const needle = normalizeForMatch(quote)
  return needle.length >= 8 && normalizeForMatch(sourceBody).includes(needle)
}

const MAX_QUOTES = 3
const MAX_QUOTE_LENGTH = 400
const MAX_REASON_LENGTH = 400

/**
 * Check a grade from the model against the sources. A quote stays only if
 * its words are in the source it names. A grade that needs evidence and has
 * no quote left becomes "unknown", so the checker never shows a grade that
 * the visitor cannot check.
 */
export function validateGrade(
  raw: unknown,
  sourcesById: ReadonlyMap<string, ChatSource>,
): Grade {
  const record =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const verdict = isVerdict(record.verdict) ? record.verdict : 'unknown'
  const reason =
    typeof record.reason === 'string'
      ? record.reason.trim().slice(0, MAX_REASON_LENGTH)
      : ''

  const seen = new Set<string>()
  const evidence: Array<EvidenceQuote> = []
  for (const item of Array.isArray(record.evidence) ? record.evidence : []) {
    if (!item || typeof item !== 'object') continue
    const { source, quote } = item as Record<string, unknown>
    if (typeof source !== 'string' || typeof quote !== 'string') continue
    const sourceId = source.trim().replace(/^\[|\]$/g, '')
    const found = sourcesById.get(sourceId)
    const text = quote.trim().replace(/^["'“]|["'”]$/g, '')
    if (!found || text.length > MAX_QUOTE_LENGTH) continue
    // Section titles are part of the record too (roles, dates, projects).
    if (!quoteIsInSource(text, `${found.title}\n${found.body}`)) continue
    const key = `${sourceId}:${normalizeForMatch(text)}`
    if (seen.has(key)) continue
    seen.add(key)
    evidence.push({ sourceId, quote: text })
    if (evidence.length === MAX_QUOTES) break
  }

  if (needsEvidence(verdict) && evidence.length === 0) {
    return {
      verdict: 'unknown',
      reason:
        'The checker could not match its evidence to the sources, so it does not grade this part.',
      evidence: [],
      downgraded: true,
    }
  }

  return {
    verdict,
    reason,
    // Grades that do not need evidence can still show related quotes.
    evidence,
    downgraded: false,
  }
}

/**
 * Split a source body into text and highlighted parts for a quote. The
 * match ignores the same differences as `normalizeForMatch`.
 */
export function highlightQuote(
  body: string,
  quote: string,
): Array<{ text: string; match: boolean }> {
  const needle = normalizeForMatch(quote)
  if (!needle) return [{ text: body, match: false }]
  // Build the normalized body with a map back to original indexes.
  let normalized = ''
  const map: Array<number> = []
  let lastWasSpace = false
  for (let index = 0; index < body.length; index++) {
    let character = body[index]
    if (/[*_`]/.test(character)) continue
    if (/\s/.test(character)) {
      if (lastWasSpace || normalized.length === 0) continue
      character = ' '
      lastWasSpace = true
    } else {
      lastWasSpace = false
      character = character
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-')
        .toLowerCase()
    }
    normalized += character
    map.push(index)
  }
  const start = normalized.indexOf(needle)
  if (start === -1) return [{ text: body, match: false }]
  const from = map[start]
  const to = map[start + needle.length - 1] + 1
  return [
    { text: body.slice(0, from), match: false },
    { text: body.slice(from, to), match: true },
    { text: body.slice(to), match: false },
  ].filter((part) => part.text.length > 0)
}
