import { createFileRoute } from '@tanstack/react-router'
import ConversationAdmin from '~/components/admin/ConversationAdmin'

export const Route = createFileRoute('/admin/conversations')({
  head: () => ({
    meta: [
      { title: 'Chat Conversations | Ali Abbas' },
      { name: 'robots', content: 'noindex, nofollow, noarchive' },
    ],
  }),
  component: ConversationAdmin,
})
