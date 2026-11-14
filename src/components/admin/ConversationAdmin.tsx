import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Reader,
  ReaderSection,
  ReaderText,
  ReaderTitle,
  hudText,
} from '~/components/reader/Reader'
import Shimmer from '~/components/ui/shimmer'
import type {
  ConversationSummary,
  StoredConversation,
} from '~/lib/chat-storage'
import { CHAT_RETENTION_DAYS } from '~/lib/chat-storage'
import { authClient } from '~/lib/auth-client'
import { cn } from 'cn'

/**
 * The private page of the chat conversations, in the style of the world:
 * HUD labels and actions, body text in DM Sans, and no colors of its own.
 * It sits under the HUD, so Back and the Index stay at the top.
 */

type AdminIdentity = {
  email: string
  name: string | null
}

type AccessError = {
  status: 401 | 403 | 503
  message: string
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** A HUD action: spaced capitals that fill with the HUD color. */
const action = cn(hudText, 'hud-fill uppercase disabled:opacity-50')

/** A field, as on the contact page. */
const field =
  'border-hud/40 focus:border-hud placeholder:text-hud/45 text-foreground w-full border-b bg-transparent py-3 text-base outline-none transition-colors'

function getLocation(conversation: ConversationSummary | StoredConversation) {
  return [conversation.city, conversation.region, conversation.country]
    .filter(Boolean)
    .join(', ')
}

function getDevice(conversation: ConversationSummary | StoredConversation) {
  return [
    conversation.browser,
    conversation.operatingSystem,
    conversation.device,
  ]
    .filter(Boolean)
    .join(' · ')
}

async function getErrorMessage(response: Response) {
  const body: unknown = await response.json().catch(() => null)
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error
  }
  return 'Something went wrong.'
}

function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  const authCookie = authClient.getCookie()

  if (authCookie) {
    headers.set('Better-Auth-Cookie', authCookie)
  }

  return fetch(input, { ...init, headers })
}

/** An answer of the AI, as Markdown in the body face. */
function MessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <p className="text-foreground font-semibold">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="text-foreground font-semibold">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="text-foreground font-semibold">{children}</p>
          ),
          h4: ({ children }) => (
            <p className="text-foreground font-semibold">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-foreground decoration-hud/60 underline underline-offset-4"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="marker:text-hud list-disc space-y-1 pl-5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="marker:text-hud list-decimal space-y-1 pl-5">
              {children}
            </ol>
          ),
          code: ({ children }) => (
            <code className="font-mono text-sm">{children}</code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/** The sign-in, or why the visitor may not come in. */
function SignInPanel({
  accessError,
  onAuthenticated,
}: {
  accessError: AccessError
  onAuthenticated: () => void | Promise<void>
}) {
  const { data: session } = authClient.useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (session?.user && accessError.status === 401) {
      void onAuthenticated()
    }
  }, [accessError.status, onAuthenticated, session?.user])

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message || 'Sign in failed.')
        return
      }
      await onAuthenticated()
    } catch {
      setError('Sign in failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const signOut = async () => {
    await authClient.signOut()
    window.location.reload()
  }

  return (
    <Reader>
      <div
        aria-hidden="true"
        className="bg-background/90 pointer-events-none fixed inset-0 -z-10"
      />
      <ReaderTitle>Conversations</ReaderTitle>
      <ReaderText>{accessError.message}</ReaderText>

      {accessError.status === 503 ? (
        <ReaderText>
          Set <code className="font-mono text-sm">ADMIN_EMAILS</code> in
          wrangler.jsonc to a list of the approved emails, with a comma between
          them.
        </ReaderText>
      ) : session?.user && accessError.status === 403 ? (
        <ReaderSection title="Signed in">
          <ReaderText>
            You are signed in as {session.user.email}. This account may not open
            the conversations.
          </ReaderText>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => void signOut()}
              className={action}
            >
              Sign out
            </button>
          </div>
        </ReaderSection>
      ) : (
        <ReaderSection title="Sign in">
          <form
            onSubmit={signIn}
            className="mt-6 flex max-w-[60ch] flex-col gap-6"
          >
            <label htmlFor="admin-email" className="sr-only">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="Email"
              required
              className={field}
            />
            <label htmlFor="admin-password" className="sr-only">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Password"
              required
              className={field}
            />
            {error ? (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  action,
                  'decoration-hud/50 underline underline-offset-[10px]',
                )}
              >
                {isSubmitting ? 'Signing in' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() =>
                  void authClient.signIn.social({
                    provider: 'github',
                    callbackURL: window.location.href,
                  })
                }
                className={action}
              >
                Continue with GitHub
              </button>
            </div>
          </form>
        </ReaderSection>
      )}
    </Reader>
  )
}

export default function ConversationAdmin() {
  const [conversations, setConversations] = useState<
    Array<ConversationSummary>
  >([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] =
    useState<StoredConversation | null>(null)
  const [admin, setAdmin] = useState<AdminIdentity | null>(null)
  const [accessError, setAccessError] = useState<AccessError | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  // On a narrow screen, the list and a conversation take turns.
  const [narrowView, setNarrowView] = useState<'list' | 'conversation'>('list')

  const loadConversation = useCallback(async (id: string) => {
    setSelectedId(id)
    setIsDetailLoading(true)
    setError('')

    try {
      const response = await adminFetch(
        `/api/admin/conversations?id=${encodeURIComponent(id)}`,
      )
      if (!response.ok) throw new Error(await getErrorMessage(response))
      const payload = (await response.json()) as {
        conversation: StoredConversation
      }
      setSelectedConversation(payload.conversation)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the conversation.',
      )
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await adminFetch('/api/admin/conversations')
      if (!response.ok) {
        const message = await getErrorMessage(response)
        if ([401, 403, 503].includes(response.status)) {
          setAccessError({
            status: response.status as AccessError['status'],
            message,
          })
          return
        }
        throw new Error(message)
      }

      const payload = (await response.json()) as {
        conversations: Array<ConversationSummary>
        admin: AdminIdentity
      }
      setAccessError(null)
      setAdmin(payload.admin)
      setConversations(payload.conversations)

      const nextId = payload.conversations[0]?.id ?? null

      if (nextId) {
        await loadConversation(nextId)
      } else {
        setSelectedId(null)
        setSelectedConversation(null)
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load conversations.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [loadConversation])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations

    return conversations.filter((conversation) =>
      [
        conversation.preview,
        conversation.city,
        conversation.region,
        conversation.country,
        conversation.browser,
        conversation.operatingSystem,
        conversation.device,
      ].some((value) => value?.toLowerCase().includes(query)),
    )
  }, [conversations, search])

  const deleteSelectedConversation = async () => {
    if (
      !selectedId ||
      !window.confirm('Delete this conversation? You cannot undo this.')
    ) {
      return
    }

    setIsDeleting(true)
    setError('')
    try {
      const response = await adminFetch('/api/admin/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))

      setSelectedId(null)
      setSelectedConversation(null)
      setNarrowView('list')
      await loadConversations()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete the conversation.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const signOut = async () => {
    await authClient.signOut()
    window.location.reload()
  }

  if (accessError) {
    return (
      <SignInPanel
        accessError={accessError}
        onAuthenticated={loadConversations}
      />
    )
  }

  const count = filteredConversations.length

  return (
    <main
      data-hud
      className="relative z-10 flex h-svh flex-col px-6 pt-24 pb-6 sm:px-16 lg:mx-[var(--frame-inset)]"
    >
      {/* A work page: the world stays far behind a dark backdrop, so the
          text reads the same in any light of the sky. */}
      <div
        aria-hidden="true"
        className="bg-background/90 pointer-events-none fixed inset-0 -z-10"
      />
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <h1 className="font-hud text-hud text-lg leading-[1.9] tracking-[0.42em] uppercase">
            Conversations
          </h1>
          <p className="text-fg-muted mt-2 text-sm">
            {admin ? `Signed in as ${admin.email}. ` : null}
            Conversations are kept for {CHAT_RETENTION_DAYS} days.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void loadConversations()}
            className={action}
          >
            {isLoading ? 'Loading' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className={action}
          >
            Sign out
          </button>
        </div>
      </header>

      {error ? (
        <p role="alert" className="text-destructive mt-6 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid min-h-0 flex-1 gap-x-16 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <section
          aria-label="All conversations"
          className={cn(
            'min-h-0 flex-col',
            narrowView === 'list' ? 'flex' : 'hidden lg:flex',
          )}
        >
          <label htmlFor="admin-search" className="sr-only">
            Search conversations
          </label>
          <input
            id="admin-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions, places or browsers"
            className={field}
          />
          <p className={cn(hudText, 'mt-4')} aria-live="polite">
            {count} {count === 1 ? 'conversation' : 'conversations'}
          </p>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {isLoading && !conversations.length ? (
              <p className={cn(hudText, 'py-8')}>
                <Shimmer>Loading</Shimmer>
              </p>
            ) : count ? (
              <ul className="divide-border divide-y">
                {filteredConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <ConversationRow
                      conversation={conversation}
                      selected={selectedId === conversation.id}
                      onSelect={() => {
                        setNarrowView('conversation')
                        void loadConversation(conversation.id)
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fg-muted py-8 text-base">
                {conversations.length
                  ? 'No conversation matches the search.'
                  : 'No conversations yet.'}
              </p>
            )}
          </div>
        </section>

        <section
          aria-label="Conversation"
          className={cn(
            'min-h-0 flex-col',
            narrowView === 'conversation' ? 'flex' : 'hidden lg:flex',
          )}
        >
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setNarrowView('list')}
              className={action}
            >
              All conversations
            </button>
          </div>
          {isDetailLoading ? (
            <p className={cn(hudText, 'py-8')}>
              <Shimmer>Loading</Shimmer>
            </p>
          ) : selectedConversation ? (
            <ConversationView
              conversation={selectedConversation}
              deleting={isDeleting}
              onDelete={() => void deleteSelectedConversation()}
            />
          ) : (
            <p className="text-fg-muted py-8 text-base">
              Select a conversation to read it.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

/** One conversation in the list: its first question, when, and where. */
function ConversationRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ConversationSummary
  selected: boolean
  onSelect: () => void
}) {
  const place = getLocation(conversation)
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={cn(
        'focus-visible:outline-hud relative block w-full py-4 pr-2 pl-5 text-left outline-none focus-visible:outline-1 focus-visible:-outline-offset-1',
        'before:bg-hud before:absolute before:inset-y-4 before:left-0 before:w-0.5 before:opacity-0 before:transition-opacity hover:before:opacity-40',
        selected && 'before:opacity-100 hover:before:opacity-100',
      )}
    >
      <span
        className={cn(
          'line-clamp-2 text-base leading-6',
          selected ? 'text-foreground' : 'text-fg-secondary',
        )}
      >
        {conversation.preview || 'No question yet'}
      </span>
      <span className="text-fg-muted mt-2 block text-sm">
        {dateFormatter.format(conversation.lastMessageAt)} ·{' '}
        {conversation.messageCount}{' '}
        {conversation.messageCount === 1 ? 'message' : 'messages'}
      </span>
      {place || conversation.browser ? (
        <span className="text-fg-muted block truncate text-sm">
          {[place, conversation.browser].filter(Boolean).join(' · ')}
        </span>
      ) : null}
    </button>
  )
}

/** A conversation: where it came from, then its messages. */
function ConversationView({
  conversation,
  deleting,
  onDelete,
}: {
  conversation: StoredConversation
  deleting: boolean
  onDelete: () => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24">
      <dl className="mt-4 grid max-w-[60ch] grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm lg:mt-1">
        <Detail term="Started">
          {dateFormatter.format(conversation.startedAt)}
        </Detail>
        <Detail term="Place">{getLocation(conversation) || 'Not known'}</Detail>
        <Detail term="Device">{getDevice(conversation) || 'Not known'}</Detail>
        <Detail term="Id">
          <span className="font-mono text-sm break-all">{conversation.id}</span>
        </Detail>
      </dl>
      {conversation.userAgent ? (
        <details className="text-fg-muted mt-3 max-w-[60ch] text-sm">
          <summary className="hover:text-foreground cursor-pointer">
            Full user agent
          </summary>
          <p className="mt-2 font-mono text-sm leading-6 break-all">
            {conversation.userAgent}
          </p>
        </details>
      ) : null}
      <div className="mt-6">
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className={action}
        >
          {deleting ? 'Deleting' : 'Delete conversation'}
        </button>
      </div>

      <ol aria-label="Messages" className="mt-12 flex max-w-[68ch] flex-col">
        {conversation.messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              message.role === 'user' ? 'mt-12 first:mt-0' : 'mt-5',
            )}
          >
            <p className={hudText}>
              {message.role === 'user' ? 'Visitor' : 'AI'}
              <span className="text-fg-muted ml-4 font-sans text-sm tracking-normal normal-case">
                {dateFormatter.format(message.createdAt)}
                {message.status !== 'complete' ? ` · ${message.status}` : ''}
              </span>
            </p>
            <div
              className={cn(
                'mt-2 text-base leading-7',
                message.role === 'user'
                  ? 'text-foreground border-hud/50 border-l-2 pl-4 whitespace-pre-wrap'
                  : 'text-fg-secondary',
              )}
            >
              {message.role === 'assistant' ? (
                <MessageContent content={message.content} />
              ) : (
                message.content
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{term}</dt>
      <dd className="text-fg-secondary">{children}</dd>
    </>
  )
}
