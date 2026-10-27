import type { ChatSource } from './protocol'

const URL_PATTERN = /https?:\/\/[^\s)>\]]+/

/**
 * Split the knowledge base into citable sources: one per `###` section, and
 * one for the text of a `##` section before its first `###`. The `#` title is
 * not a source. Ids are S1, S2, … in document order.
 */
export function parseKnowledgeSources(markdown: string): Array<ChatSource> {
  const sources: Array<ChatSource> = []
  let group: string | undefined
  let current: { title: string; group?: string; lines: Array<string> } | null =
    null

  const close = () => {
    if (!current) return
    const body = current.lines.join('\n').trim()
    if (body) {
      const href = body.match(URL_PATTERN)?.[0]?.replace(/[.,;:]+$/, '')
      sources.push({
        id: `S${sources.length + 1}`,
        title: current.title,
        ...(current.group ? { group: current.group } : {}),
        body,
        ...(href ? { href } : {}),
      })
    }
    current = null
  }

  for (const line of markdown.split('\n')) {
    const heading = line.match(/^(#{1,3})\s+(.+?)\s*$/)
    if (!heading) {
      current?.lines.push(line)
      continue
    }

    close()
    const level = heading[1].length
    const title = heading[2]
    if (level === 1) {
      group = undefined
    } else if (level === 2) {
      group = title
      current = { title, lines: [] }
    } else {
      current = { title, ...(group ? { group } : {}), lines: [] }
    }
  }
  close()

  return sources
}

/** The sources as tagged reference data for the system prompt. */
export function formatSourcesForPrompt(sources: ReadonlyArray<ChatSource>) {
  return sources
    .map((source) => {
      const title = source.group
        ? `${source.group} › ${source.title}`
        : source.title
      return `<SOURCE id="${source.id}" title="${title.replaceAll('"', "'")}">\n${source.body}\n</SOURCE>`
    })
    .join('\n\n')
}
