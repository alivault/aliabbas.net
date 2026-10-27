const LIST_ITEM_START = /^(?:[-*+]|\d{1,9}[.)])(?:[ \t]|$)/

/**
 * Split streaming markdown into chunks that each parse alone. A chunk ends
 * before a line that starts a new top-level block after a blank line, outside
 * code fences. Indented lines and list items do not start a chunk, so lists
 * and code stay whole. Only complete lines start a chunk, so the start of a
 * chunk does not move when more text arrives. The finished chunks keep the
 * same text, so a memoized renderer parses only the last chunk again on each
 * token.
 *
 * Adapted from Pico (https://github.com/alivault/pico).
 */
export function splitStreamingMarkdown(markdown: string) {
  const chunks: Array<string> = []
  const lines = markdown.split('\n')
  let chunkStart = 0
  let lineStart = 0
  let previousLineBlank = false
  let fence: { char: string; length: number } | null = null

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index]
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    const lineComplete = index < lines.length - 1
    const blank = line.trim() === ''

    if (
      lineComplete &&
      previousLineBlank &&
      !blank &&
      !fence &&
      lineStart > chunkStart &&
      !/^[ \t]/.test(line) &&
      !LIST_ITEM_START.test(line)
    ) {
      chunks.push(markdown.slice(chunkStart, lineStart))
      chunkStart = lineStart
    }

    if (fence) {
      const marker = line.match(/^(?: {0,3})(`{3,}|~{3,})[ \t]*$/)?.[1]
      if (marker && marker[0] === fence.char && marker.length >= fence.length) {
        fence = null
      }
    } else {
      const opening = line.match(/^(?: {0,3})(`{3,}|~{3,})(.*)$/)
      if (
        opening &&
        (opening[1][0] !== '`' || !(opening[2] ?? '').includes('`'))
      ) {
        fence = { char: opening[1][0], length: opening[1].length }
      }
    }

    previousLineBlank = blank
    lineStart += rawLine.length + 1
  }

  chunks.push(markdown.slice(chunkStart))
  return chunks
}

/** Answer text as plain prose, for copying and for screen-reader announcements. */
export function answerToPlainText(
  answer: string,
  sourceNumber: (id: string) => number | undefined,
) {
  return answer
    .replace(/\[(S\d{1,3})\]/g, (_match, id: string) => {
      const number = sourceNumber(id)
      return number ? `[${number}]` : ''
    })
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .trim()
}
