/**
 * Check citation markers in a token stream before they reach the client.
 *
 * The model writes markers such as `[S4]`, `[S4, S7]` or `[S4; 7]`. Tokens
 * can split a marker (`[S` + `4]`), so the filter holds back a tail that can
 * still become a marker. Each marker is rewritten to `[S4][S7]` form. A
 * marker with an id that is not in the knowledge base is removed, so the
 * client can show only citations that have evidence.
 */

const MARKER = / ?\[\s*(S\d{1,3}(?:\s*[,;]\s*S?\d{1,3})*)\s*\]/g
const MARKER_PREFIX = /\[\s*(?:S(?:\d{1,3}(?:\s*[,;]\s*S?\d{0,3})*)?)?\s*$/
const MAX_HELD_LENGTH = 48

export type CitationFilterOutput = {
  text: string
  /** Ids cited for the first time in this output, in order. */
  newSourceIds: Array<string>
}

export function createCitationFilter(validIds: ReadonlySet<string>) {
  const cited = new Set<string>()
  let pending = ''

  const rewrite = (text: string): CitationFilterOutput => {
    const newSourceIds: Array<string> = []
    // The marker takes the space before it. The chip has its own margin,
    // and no space means a chip never wraps to a line alone.
    const output = text.replace(MARKER, (_match, list: string) => {
      const ids = list
        .split(/[,;]/)
        .map((part) => part.trim())
        .map((part) => (part.startsWith('S') ? part : `S${part}`))
        .filter(
          (id, index, all) => validIds.has(id) && all.indexOf(id) === index,
        )

      for (const id of ids) {
        if (!cited.has(id)) {
          cited.add(id)
          newSourceIds.push(id)
        }
      }

      return ids.map((id) => `[${id}]`).join('')
    })
    return { text: output, newSourceIds }
  }

  return {
    push(delta: string): CitationFilterOutput {
      pending += delta
      const open = pending.lastIndexOf('[')
      let holdFrom = pending.length
      if (
        open !== -1 &&
        pending.length - open <= MAX_HELD_LENGTH &&
        MARKER_PREFIX.test(pending.slice(open))
      ) {
        holdFrom = open
        // Keep a space before the marker with it, so a removed marker does
        // not leave a space before the punctuation that follows.
        if (holdFrom > 0 && pending[holdFrom - 1] === ' ') holdFrom -= 1
      } else if (pending.endsWith(' ')) {
        // A marker can follow this space in the next token.
        holdFrom -= 1
      }
      const ready = pending.slice(0, holdFrom)
      pending = pending.slice(holdFrom)
      return rewrite(ready)
    },
    flush(): CitationFilterOutput {
      const rest = pending
      pending = ''
      return rewrite(rest)
    },
    get citedIds(): ReadonlySet<string> {
      return cited
    },
  }
}
