import aliKnowledge from '~/data/ali-knowledge.md?raw'
import { parseKnowledgeSources } from '~/lib/chat/knowledge-sources'

/** The citable sections of the knowledge base, for the server routes. */
export const SOURCES = parseKnowledgeSources(aliKnowledge)
export const SOURCES_BY_ID = new Map(
  SOURCES.map((source) => [source.id, source]),
)
export const SOURCE_IDS = new Set(SOURCES_BY_ID.keys())
