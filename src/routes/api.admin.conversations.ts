import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { getAdminAccess } from '~/lib/admin-auth'
import {
  deleteConversationAsAdmin,
  getConversation,
  listConversations,
} from '~/lib/chat-storage'

const DeleteRequestSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{16,120}$/),
})

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function authorizeAdmin() {
  const access = await getAdminAccess()

  if (access.status === 'authorized') return access
  if (access.status === 'unconfigured') {
    return jsonResponse({ error: 'Admin access is not configured.' }, 503)
  }
  if (access.status === 'forbidden') {
    return jsonResponse({ error: 'This account is not an administrator.' }, 403)
  }
  return jsonResponse({ error: 'Sign in to continue.' }, 401)
}

export const Route = createFileRoute('/api/admin/conversations')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authorization = await authorizeAdmin()
        if (authorization instanceof Response) return authorization

        const url = new URL(request.url)
        const conversationId = url.searchParams.get('id')

        if (conversationId) {
          const parsedId =
            DeleteRequestSchema.shape.id.safeParse(conversationId)
          if (!parsedId.success) {
            return jsonResponse({ error: 'Invalid conversation ID.' }, 400)
          }

          const conversation = await getConversation(env.CHAT_DB, parsedId.data)
          if (!conversation) {
            return jsonResponse({ error: 'Conversation not found.' }, 404)
          }

          return jsonResponse({ conversation, admin: authorization })
        }

        const conversations = await listConversations(env.CHAT_DB)
        return jsonResponse({ conversations, admin: authorization })
      },
      DELETE: async ({ request }) => {
        const origin = request.headers.get('Origin')
        if (origin && origin !== new URL(request.url).origin) {
          return jsonResponse({ error: 'Invalid request origin.' }, 403)
        }

        const authorization = await authorizeAdmin()
        if (authorization instanceof Response) return authorization

        if (
          !request.headers.get('Content-Type')?.includes('application/json')
        ) {
          return jsonResponse({ error: 'Expected a JSON request.' }, 415)
        }

        const contentLength = Number(request.headers.get('Content-Length') ?? 0)
        if (contentLength > 2_000) {
          return jsonResponse({ error: 'That request is too large.' }, 413)
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return jsonResponse({ error: 'Invalid JSON request.' }, 400)
        }

        const parsed = DeleteRequestSchema.safeParse(body)
        if (!parsed.success) {
          return jsonResponse({ error: 'Invalid conversation ID.' }, 400)
        }

        await deleteConversationAsAdmin(env.CHAT_DB, parsed.data.id)
        return new Response(null, {
          status: 204,
          headers: { 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
