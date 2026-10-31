import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Clock3,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageSquareText,
  Monitor,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import GitHubIcon from '~/components/GitHubIcon'
import PageHeading from '~/components/PageHeading'
import Title from '~/components/Title'
import { Button, buttonVariants } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import type {
  ConversationSummary,
  StoredConversation,
} from '~/lib/chat-storage'
import { authClient } from '~/lib/auth-client'
import { cn } from 'cn'

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

function getLocation(conversation: ConversationSummary | StoredConversation) {
  return [conversation.city, conversation.region, conversation.country]
    .filter(Boolean)
    .join(', ')
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

function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <Title as="h1" variant="card">
            {children}
          </Title>
        ),
        h2: ({ children }) => (
          <Title as="h2" variant="subsection">
            {children}
          </Title>
        ),
        h3: ({ children }) => (
          <Title as="h3" variant="detail">
            {children}
          </Title>
        ),
        h4: ({ children }) => (
          <Title as="h4" variant="detail">
            {children}
          </Title>
        ),
        h5: ({ children }) => (
          <Title as="h5" variant="detail">
            {children}
          </Title>
        ),
        h6: ({ children }) => (
          <Title as="h6" variant="detail">
            {children}
          </Title>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-4"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="list-disc space-y-1 pl-5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal space-y-1 pl-5">{children}</ol>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

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
    <div className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-16 scheme-dark">
      <div className="w-full max-w-md border border-white/15 bg-white/[0.04] p-6 sm:p-8">
        <Link
          to="/"
          className="mb-12 inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"
        >
          <ArrowLeft className="size-3.5" /> Back to portfolio
        </Link>
        <p className="font-mono text-[10px] text-[#d9ff43] uppercase">
          Private admin
        </p>
        <PageHeading size="compact" className="mt-4">
          Conversations
        </PageHeading>
        <p className="mt-5 text-sm leading-6 text-white/50">
          {accessError.message}
        </p>

        {accessError.status === 503 ? (
          <div className="mt-8 rounded-lg border border-[#ffbf69]/30 bg-[#ffbf69]/10 p-4 text-sm leading-6 text-[#ffcf8d]">
            Set the <code className="font-mono">ADMIN_EMAILS</code> Worker
            secret to a comma-separated list of approved Better Auth emails.
          </div>
        ) : session?.user && accessError.status === 403 ? (
          <div className="mt-8">
            <p className="text-sm text-white/60">
              Signed in as {session.user.email}
            </p>
            <Button
              type="button"
              variant="outline"
              size="pill-lg"
              onClick={() => void signOut()}
              className="mt-5 w-full"
            >
              <LogOut /> Sign out
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={signIn} className="mt-8 space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="Admin email"
                required
                className="h-12 border-white/15 bg-white/5 text-white placeholder:text-white/25"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                required
                className="h-12 border-white/15 bg-white/5 text-white placeholder:text-white/25"
              />
              {error && <p className="text-sm text-[#ff8b75]">{error}</p>}
              <Button
                type="submit"
                size="pill-lg"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting && <LoaderCircle className="animate-spin" />}
                Sign in
              </Button>
            </form>
            <div className="my-6 flex items-center gap-3 text-[10px] text-white/25 uppercase">
              <span className="h-px flex-1 bg-white/10" /> or
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void authClient.signIn.social({
                  provider: 'github',
                  callbackURL: window.location.href,
                })
              }
              size="pill-lg"
              className="w-full"
            >
              <GitHubIcon className="size-4" /> Continue with GitHub
            </Button>
          </>
        )}
      </div>
    </div>
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
      !window.confirm('Permanently delete this conversation?')
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

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col scheme-dark">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/15 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={buttonVariants({
              variant: 'outline',
              size: 'icon-pill',
            })}
            aria-label="Back to portfolio"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold">Chat conversations</p>
            <p className="font-mono text-[8px] text-white/30 uppercase">
              {admin?.email ?? 'Private admin'}
            </p>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isLoading}
                    onClick={() => void loadConversations()}
                    aria-label="Refresh conversations"
                  >
                    <RefreshCw className={cn(isLoading && 'animate-spin')} />
                  </Button>
                }
              />
              <TooltipContent side="bottom">
                Refresh conversations
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void signOut()}
                    aria-label="Sign out"
                  >
                    <LogOut />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Sign out</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </header>

      {error && (
        <div className="border-b border-[#ff8b75]/25 bg-[#ff8b75]/10 px-5 py-3 text-sm text-[#ffab9b]">
          {error}
        </div>
      )}

      <main className="grid min-h-0 flex-1 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="flex min-h-[420px] flex-col border-b border-white/15 lg:min-h-0 lg:border-r lg:border-b-0">
          <div className="border-b border-white/15 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/25" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions or location"
                className="h-10 border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/25"
              />
            </div>
            <p className="mt-3 font-mono text-[9px] text-white/25 uppercase">
              {filteredConversations.length} conversations · 90-day retention
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading && !conversations.length ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle className="size-5 animate-spin text-[#d9ff43]" />
              </div>
            ) : filteredConversations.length ? (
              filteredConversations.map((conversation) => {
                const location = getLocation(conversation)
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void loadConversation(conversation.id)}
                    className={cn(
                      'block w-full border-b border-white/10 px-4 py-4 text-left transition-colors hover:bg-white/[0.06]',
                      selectedId === conversation.id && 'bg-white/[0.08]',
                    )}
                  >
                    <p className="line-clamp-2 text-sm leading-5 text-white/75">
                      {conversation.preview || 'Conversation started'}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[8px] text-white/30 uppercase">
                      <span>
                        {dateFormatter.format(conversation.lastMessageAt)}
                      </span>
                      <span>{conversation.messageCount} messages</span>
                    </div>
                    {(location || conversation.browser) && (
                      <p className="mt-2 truncate text-[11px] text-white/30">
                        {[location, conversation.browser]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </button>
                )
              })
            ) : (
              <p className="px-5 py-12 text-center text-sm text-white/35">
                No conversations found.
              </p>
            )}
          </div>
        </aside>

        <section className="flex min-h-[600px] min-w-0 flex-col lg:min-h-0">
          {isDetailLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <LoaderCircle className="size-6 animate-spin text-[#d9ff43]" />
            </div>
          ) : selectedConversation ? (
            <>
              <div className="border-b border-white/15 px-5 py-5 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="font-mono text-[9px] text-white/30 uppercase">
                      Conversation
                    </p>
                    <p className="mt-1 text-xs break-all text-white/55">
                      {selectedConversation.id}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => void deleteSelectedConversation()}
                  >
                    {isDeleting ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                    Delete
                  </Button>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/45">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                    <Clock3 className="size-3" />
                    {dateFormatter.format(selectedConversation.startedAt)}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                    <MapPin className="size-3" />
                    {getLocation(selectedConversation) || 'Unknown location'}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                    <Monitor className="size-3" />
                    {[
                      selectedConversation.browser,
                      selectedConversation.operatingSystem,
                      selectedConversation.device,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Unknown device'}
                  </span>
                </div>
                {selectedConversation.userAgent && (
                  <details className="mt-4 text-xs text-white/30">
                    <summary className="cursor-pointer hover:text-white/55">
                      Full user agent
                    </summary>
                    <p className="mt-2 font-mono text-[10px] leading-5 break-all">
                      {selectedConversation.userAgent}
                    </p>
                  </details>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
                <div className="mx-auto max-w-3xl space-y-7">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' && 'flex-row-reverse',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full',
                          message.role === 'user'
                            ? 'bg-[#d9ff43] text-[#10100f]'
                            : 'border border-white/15 text-[#d9ff43]',
                        )}
                      >
                        <MessageSquareText className="size-3.5" />
                      </span>
                      <div
                        className={cn(
                          'max-w-[min(100%,42rem)] text-sm leading-7',
                          message.role === 'user'
                            ? 'rounded-2xl rounded-tr-sm bg-[#d9ff43] px-4 py-2.5 text-[#10100f]'
                            : 'pt-0.5 text-white/70',
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <MessageContent content={message.content} />
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        <p
                          className={cn(
                            'mt-2 font-mono text-[8px] uppercase',
                            message.role === 'user'
                              ? 'text-black/35'
                              : 'text-white/25',
                          )}
                        >
                          {dateFormatter.format(message.createdAt)} ·{' '}
                          {message.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-5 text-center text-sm text-white/35">
              Select a conversation to view its messages.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
