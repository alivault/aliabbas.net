import handler from '@tanstack/react-start/server-entry'
import { purgeExpiredConversations } from '~/lib/chat-storage'

export default {
  fetch: handler.fetch,
  scheduled(_event: ScheduledController, env: Env, context: ExecutionContext) {
    context.waitUntil(purgeExpiredConversations(env.CHAT_DB))
  },
}
