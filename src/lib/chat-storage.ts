export const CHAT_RETENTION_DAYS = 90
export const CHAT_RETENTION_MS = CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000
const RETENTION_CLEANUP_BUFFER_MS = 60 * 60 * 1000

export type ConversationMetadata = {
  country: string | null
  region: string | null
  city: string | null
  browser: string | null
  operatingSystem: string | null
  device: string | null
  userAgent: string | null
}

export type ConversationSummary = ConversationMetadata & {
  id: string
  startedAt: number
  lastMessageAt: number
  lastStatus: string
  messageCount: number
  preview: string | null
}

export type StoredMessage = {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  status: string
}

export type StoredConversation = ConversationMetadata & {
  id: string
  startedAt: number
  lastMessageAt: number
  lastStatus: string
  messages: Array<StoredMessage>
}

function cleanMetadata(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim().slice(0, maxLength)
  return cleaned || null
}

function parseUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return {
      browser: null,
      operatingSystem: null,
      device: null,
    }
  }

  const browser = /Edg\//.test(userAgent)
    ? 'Microsoft Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /CriOS\//.test(userAgent)
        ? 'Chrome on iOS'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent) && /Version\//.test(userAgent)
            ? 'Safari'
            : 'Other browser'

  const operatingSystem = /iPhone|iPad|iPod/.test(userAgent)
    ? 'iOS / iPadOS'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Mac OS X|Macintosh/.test(userAgent)
        ? 'macOS'
        : /Windows NT/.test(userAgent)
          ? 'Windows'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Other OS'

  const device = /iPad|Tablet/.test(userAgent)
    ? 'Tablet'
    : /Mobile|iPhone|iPod|Android/.test(userAgent)
      ? 'Mobile'
      : 'Desktop'

  return { browser, operatingSystem, device }
}

export function getConversationMetadata(
  request: Request,
): ConversationMetadata {
  const userAgent = cleanMetadata(request.headers.get('User-Agent'), 500)
  const parsedUserAgent = parseUserAgent(userAgent)
  const requestWithCf = request as Request<unknown, IncomingRequestCfProperties>
  const cf = requestWithCf.cf

  return {
    country: cleanMetadata(cf?.country, 80),
    region: cleanMetadata(cf?.region, 120),
    city: cleanMetadata(cf?.city, 120),
    browser: parsedUserAgent.browser,
    operatingSystem: parsedUserAgent.operatingSystem,
    device: parsedUserAgent.device,
    userAgent,
  }
}

export async function hashDeleteToken(token: string) {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export async function ensureConversation(
  database: D1Database,
  input: {
    id: string
    deleteTokenHash: string
    metadata: ConversationMetadata
    now: number
  },
) {
  const existing = await database
    .prepare(
      'SELECT delete_token_hash AS deleteTokenHash FROM conversations WHERE id = ?',
    )
    .bind(input.id)
    .first<{ deleteTokenHash: string }>()

  if (existing && existing.deleteTokenHash !== input.deleteTokenHash) {
    return false
  }

  if (!existing) {
    await database
      .prepare(
        `INSERT INTO conversations (
          id, delete_token_hash, started_at, last_message_at, country, region,
          city, browser, operating_system, device, user_agent, last_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      )
      .bind(
        input.id,
        input.deleteTokenHash,
        input.now,
        input.now,
        input.metadata.country,
        input.metadata.region,
        input.metadata.city,
        input.metadata.browser,
        input.metadata.operatingSystem,
        input.metadata.device,
        input.metadata.userAgent,
      )
      .run()
  } else {
    await database
      .prepare(
        `UPDATE conversations SET
          last_message_at = ?, country = ?, region = ?, city = ?, browser = ?,
          operating_system = ?, device = ?, user_agent = ?, last_status = 'active'
        WHERE id = ?`,
      )
      .bind(
        input.now,
        input.metadata.country,
        input.metadata.region,
        input.metadata.city,
        input.metadata.browser,
        input.metadata.operatingSystem,
        input.metadata.device,
        input.metadata.userAgent,
        input.id,
      )
      .run()
  }

  return true
}

export async function storeMessage(
  database: D1Database,
  message: StoredMessage,
) {
  await database
    .prepare(
      `INSERT OR REPLACE INTO messages (
        id, conversation_id, role, content, created_at, status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      message.id,
      message.conversationId,
      message.role,
      message.content,
      message.createdAt,
      message.status,
    )
    .run()

  await database
    .prepare(
      'UPDATE conversations SET last_message_at = ?, last_status = ? WHERE id = ?',
    )
    .bind(message.createdAt, message.status, message.conversationId)
    .run()
}

export async function updateConversationStatus(
  database: D1Database,
  conversationId: string,
  status: string,
) {
  await database
    .prepare('UPDATE conversations SET last_status = ? WHERE id = ?')
    .bind(status, conversationId)
    .run()
}

export async function deleteConversation(
  database: D1Database,
  conversationId: string,
  deleteTokenHash: string,
) {
  await database
    .prepare('DELETE FROM conversations WHERE id = ? AND delete_token_hash = ?')
    .bind(conversationId, deleteTokenHash)
    .run()
}

export async function deleteConversationAsAdmin(
  database: D1Database,
  conversationId: string,
) {
  await database
    .prepare('DELETE FROM conversations WHERE id = ?')
    .bind(conversationId)
    .run()
}

export async function purgeExpiredConversations(database: D1Database) {
  return database
    .prepare('DELETE FROM conversations WHERE last_message_at < ?')
    .bind(Date.now() - CHAT_RETENTION_MS + RETENTION_CLEANUP_BUFFER_MS)
    .run()
}

export async function listConversations(database: D1Database) {
  const result = await database
    .prepare(
      `SELECT
        c.id,
        c.started_at AS startedAt,
        c.last_message_at AS lastMessageAt,
        c.country,
        c.region,
        c.city,
        c.browser,
        c.operating_system AS operatingSystem,
        c.device,
        c.user_agent AS userAgent,
        c.last_status AS lastStatus,
        COUNT(m.id) AS messageCount,
        (
          SELECT content FROM messages
          WHERE conversation_id = c.id AND role = 'user'
          ORDER BY created_at DESC LIMIT 1
        ) AS preview
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      GROUP BY c.id
      ORDER BY c.last_message_at DESC`,
    )
    .all<ConversationSummary>()

  return result.results
}

export async function getConversation(
  database: D1Database,
  conversationId: string,
): Promise<StoredConversation | null> {
  const conversation = await database
    .prepare(
      `SELECT
        id,
        started_at AS startedAt,
        last_message_at AS lastMessageAt,
        country,
        region,
        city,
        browser,
        operating_system AS operatingSystem,
        device,
        user_agent AS userAgent,
        last_status AS lastStatus
      FROM conversations
      WHERE id = ?`,
    )
    .bind(conversationId)
    .first<Omit<StoredConversation, 'messages'>>()

  if (!conversation) return null

  const messageResult = await database
    .prepare(
      `SELECT
        id,
        conversation_id AS conversationId,
        role,
        content,
        created_at AS createdAt,
        status
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC`,
    )
    .bind(conversationId)
    .all<StoredMessage>()

  return { ...conversation, messages: messageResult.results }
}
