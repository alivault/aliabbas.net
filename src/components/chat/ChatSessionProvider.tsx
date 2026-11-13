import { createContext, use, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useChatSession } from './use-chat-session'

type ChatSessionValue = ReturnType<typeof useChatSession> & {
  draft: string
  setDraft: (draft: string) => void
}

const ChatSessionContext = createContext<ChatSessionValue | null>(null)

/**
 * The chat session for the whole site. It is above the pages, so a link in
 * an answer can open a page and the conversation (and an answer that still
 * streams) is there on the way back.
 */
export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const { turns, activeTurn, send, stop, retry, remove } = useChatSession()
  const [draft, setDraft] = useState('')
  const value = useMemo(
    () => ({ turns, activeTurn, send, stop, retry, remove, draft, setDraft }),
    [turns, activeTurn, send, stop, retry, remove, draft],
  )
  return <ChatSessionContext value={value}>{children}</ChatSessionContext>
}

export function useSharedChatSession() {
  const value = use(ChatSessionContext)
  if (!value) throw new Error('useSharedChatSession needs ChatSessionProvider')
  return value
}
