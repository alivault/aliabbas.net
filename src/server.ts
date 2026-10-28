import handler from '@tanstack/react-start/server-entry'
import { purgeExpiredConversations } from '~/lib/chat-storage'
import { purgeExpiredVitals } from '~/lib/vitals-storage'

const CANONICAL_HOST = 'aliabbas.net'
const REDIRECT_HOSTS = new Set(['aliabbas.dev', 'www.aliabbas.dev'])

export default {
  fetch(...args: Parameters<typeof handler.fetch>) {
    const url = new URL(args[0].url)
    if (REDIRECT_HOSTS.has(url.hostname)) {
      url.protocol = 'https:'
      url.hostname = CANONICAL_HOST
      url.port = ''
      return Response.redirect(url.toString(), 301)
    }
    return handler.fetch(...args)
  },
  scheduled(_event: ScheduledController, env: Env, context: ExecutionContext) {
    context.waitUntil(purgeExpiredConversations(env.CHAT_DB))
    context.waitUntil(purgeExpiredVitals(env.CHAT_DB))
  },
}
