import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import ChatReader from '~/components/reader/ChatReader'
import CheckReader from '~/components/reader/CheckReader'

/**
 * The two ways to ask the AI about Ali: the chat (/ai) and the claim
 * checker (/check). Both are readers beside the orb. Their state lives
 * above the pages (ChatSessionProvider, CheckSessionProvider), so a switch
 * between them keeps the conversation, the result and the drafts.
 */
export const Route = createFileRoute('/_assistant')({
  component: AssistantRoute,
})

function AssistantRoute() {
  const check = useLocation({
    select: (location) => location.pathname.startsWith('/check'),
  })
  return (
    <>
      {check ? <CheckReader /> : <ChatReader />}
      <Outlet />
    </>
  )
}
