import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Bot,
  LoaderCircle,
  RotateCcw,
  Trash2,
  UserRound,
} from 'lucide-react'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '~/components/ui/message-scroller'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type RequestState =
  | { status: 'idle' }
  | { status: 'streaming'; assistantId: string }
  | { status: 'error'; message: string }

type ConversationIdentity = {
  id: string
  deleteToken: string
}

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi — I'm an AI guide to Ali's public work and experience. Ask me about his background, technical strengths, projects, or fit for your team.",
} satisfies ChatMessage

const suggestedQuestions = [
  'What makes Ali a strong product engineer?',
  'Tell me about his frontend experience.',
  'Which project best shows full-stack skills?',
  'How does his design background shape his engineering?',
] as const

let messageSequence = 0

function createRandomHex(byteLength: number) {
  const values = new Uint8Array(byteLength)

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values)
  } else {
    for (let index = 0; index < values.length; index += 1) {
      values[index] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(values, (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('')
}

function createConversationIdentity(): ConversationIdentity {
  return {
    id: `conversation_${createRandomHex(12)}`,
    deleteToken: createRandomHex(24),
  }
}

function createMessageId(role: ChatMessage['role']) {
  messageSequence += 1
  return `${role}-${Date.now()}-${messageSequence}`
}

function SuggestedQuestionButtons({
  className,
  disabled,
  onSelect,
}: {
  className?: string
  disabled: boolean
  onSelect: (question: string) => void
}) {
  return (
    <div className={className}>
      {suggestedQuestions.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className="max-w-full rounded-full border border-white/15 px-4 py-2 text-left text-base text-white/60 transition-colors hover:border-[#d9ff43]/60 hover:text-[#d9ff43] disabled:pointer-events-none disabled:opacity-40"
        >
          {question}
        </button>
      ))}
    </div>
  )
}

function MessageText({ content }: { content: string }) {
  return (
    <div className="space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline decoration-current/35 underline-offset-4 hover:decoration-current"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-semibold text-white">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 marker:text-[#d9ff43]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 marker:text-[#d9ff43]">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l border-[#d9ff43]/60 pl-4 text-white/55">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => (
            <code
              className={cn(
                'rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-[#d9ff43]',
                className,
              )}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#10100f] p-3 text-xs leading-6 [&_code]:bg-transparent [&_code]:p-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-white/20 px-3 py-2 font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/10 px-3 py-2 align-top">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function StreamingIndicator() {
  return (
    <span className="flex h-6 items-center gap-1" aria-label="Thinking">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 animate-pulse rounded-full bg-[#d9ff43]"
          style={{ animationDelay: `${dot * 140}ms` }}
        />
      ))}
    </span>
  )
}

function getSseData(event: string) {
  return event
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
}

export default function PortfolioChat() {
  const [messages, setMessages] = useState<Array<ChatMessage>>([welcomeMessage])
  const [draft, setDraft] = useState('')
  const [conversation, setConversation] = useState<ConversationIdentity>(
    createConversationIdentity,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [requestState, setRequestState] = useState<RequestState>({
    status: 'idle',
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      abortControllerRef.current?.abort()
    },
    [],
  )

  const appendAssistantText = (assistantId: string, text: string) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === assistantId
          ? { ...message, content: message.content + text }
          : message,
      ),
    )
  }

  const sendMessage = async (content: string) => {
    const question = content.trim()
    if (!question || requestState.status === 'streaming') return

    const userMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: question,
    } satisfies ChatMessage
    const assistantMessage = {
      id: createMessageId('assistant'),
      role: 'assistant',
      content: '',
    } satisfies ChatMessage
    const history = messages.filter((message) => message.id !== 'welcome')
    const requestMessages = [...history, userMessage].slice(-9)

    setDraft('')
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ])
    setRequestState({
      status: 'streaming',
      assistantId: assistantMessage.id,
    })

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: requestMessages,
          conversation,
          requestId: userMessage.id,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => null)
        const message =
          errorBody &&
          typeof errorBody === 'object' &&
          'error' in errorBody &&
          typeof errorBody.error === 'string'
            ? errorBody.error
            : 'The assistant is unavailable right now. Please try again.'
        throw new Error(message)
      }

      if (!response.body) {
        throw new Error('The assistant returned an empty response.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let receivedText = false

      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() ?? ''

        for (const event of events) {
          const data = getSseData(event)
          if (!data || data === '[DONE]') continue

          const payload: unknown = JSON.parse(data)
          if (
            payload &&
            typeof payload === 'object' &&
            'response' in payload &&
            typeof payload.response === 'string'
          ) {
            receivedText = true
            appendAssistantText(assistantMessage.id, payload.response)
          }
        }

        if (done) break
      }

      if (!receivedText) {
        throw new Error('The assistant returned an empty response.')
      }

      setRequestState({ status: 'idle' })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) =>
            message.id !== assistantMessage.id || message.content.length > 0,
        ),
      )
      setRequestState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The assistant is unavailable right now. Please try again.',
      })
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }

  const resetConversation = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessages([welcomeMessage])
    setDraft('')
    setConversation(createConversationIdentity())
    setRequestState({ status: 'idle' })
  }

  const deleteCurrentConversation = async () => {
    if (messages.length === 1 || requestState.status === 'streaming') return
    if (!window.confirm('Permanently delete this conversation?')) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation }),
      })

      if (!response.ok) {
        throw new Error('The conversation could not be deleted right now.')
      }

      resetConversation()
    } catch (error) {
      setRequestState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The conversation could not be deleted right now.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const isStreaming = requestState.status === 'streaming'

  return (
    <div className="grid h-[calc(100svh-72px)] min-h-0 overflow-hidden lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] lg:border-b lg:border-white/15">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/15 px-12 py-20 lg:flex">
        <div
          aria-hidden="true"
          className="hero-grid pointer-events-none absolute inset-0"
        />
        <div className="relative z-10">
          <h1 className="font-display text-[clamp(3.5rem,6vw,6rem)] leading-[0.78] tracking-[-0.06em]">
            Ask about
            <em className="block text-[#d9ff43]">Ali.</em>
          </h1>
        </div>

        <div className="relative z-10 mt-20">
          <p className="font-mono text-[9px] tracking-[0.16em] text-white/30 uppercase">
            Try asking
          </p>
          <SuggestedQuestionButtons
            disabled={isStreaming}
            onSelect={(question) => void sendMessage(question)}
            className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:items-start"
          />
        </div>
      </div>

      <div className="flex h-full min-h-0 min-w-0 items-stretch overflow-hidden">
        <div className="flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden bg-white/[0.04]">
          <div className="flex h-14 shrink-0 items-center justify-end border-b border-white/15 px-4 sm:px-5">
            <TooltipProvider>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isStreaming || isDeleting}
                          onClick={() => void deleteCurrentConversation()}
                          className="text-white/45 hover:bg-white/10 hover:text-[#ff8b75]"
                          aria-label="Delete this conversation"
                        >
                          {isDeleting ? (
                            <LoaderCircle className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>
                      }
                    />
                    <TooltipContent side="bottom">
                      Delete this conversation
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={resetConversation}
                        className="text-white/45 hover:bg-white/10 hover:text-white"
                        aria-label="Start a new conversation"
                      >
                        <RotateCcw />
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">
                    Start a new conversation
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          <MessageScrollerProvider scrollPreviousItemPeek={48}>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport className="px-4 py-6 sm:px-6 sm:py-8">
                <MessageScrollerContent className="mx-auto w-full max-w-3xl justify-end gap-7">
                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.role === 'user'}
                    >
                      <div
                        className={cn(
                          'flex gap-3',
                          message.role === 'user' &&
                            'flex-row-reverse pl-8 sm:pl-16',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-full',
                            message.role === 'assistant'
                              ? 'border border-white/15 text-[#d9ff43]'
                              : 'bg-[#d9ff43] text-[#10100f]',
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <Bot className="size-3.5" />
                          ) : (
                            <UserRound className="size-3.5" />
                          )}
                        </span>
                        <div
                          className={cn(
                            'max-w-[min(100%,42rem)] text-base leading-7',
                            message.role === 'assistant'
                              ? 'pt-0.5 text-white/70'
                              : 'rounded-2xl rounded-tr-sm bg-[#d9ff43] px-4 py-2.5 text-[#10100f]',
                          )}
                        >
                          {message.content ? (
                            message.role === 'assistant' ? (
                              <>
                                <MessageText content={message.content} />
                                {message.id === 'welcome' &&
                                  messages.length === 1 && (
                                    <div className="mt-6 lg:hidden">
                                      <p className="font-mono text-[9px] tracking-[0.16em] text-white/30 uppercase">
                                        Try asking
                                      </p>
                                      <SuggestedQuestionButtons
                                        disabled={isStreaming}
                                        onSelect={(question) =>
                                          void sendMessage(question)
                                        }
                                        className="mt-3 flex flex-col items-start gap-2"
                                      />
                                    </div>
                                  )}
                              </>
                            ) : (
                              <p className="whitespace-pre-wrap">
                                {message.content}
                              </p>
                            )
                          ) : requestState.status === 'streaming' &&
                            requestState.assistantId === message.id ? (
                            <StreamingIndicator />
                          ) : null}
                        </div>
                      </div>
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton className="border-white/15 bg-[#252523] text-white hover:bg-[#d9ff43] hover:text-[#10100f]" />
            </MessageScroller>
          </MessageScrollerProvider>

          <div className="shrink-0 border-t border-white/15 p-3 sm:p-4">
            {requestState.status === 'error' && (
              <p role="alert" className="mb-3 text-xs text-[#ff8b75]">
                {requestState.message}
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage(draft)
              }}
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#10100f] p-2 focus-within:border-[#d9ff43]/60"
            >
              <label htmlFor="portfolio-question" className="sr-only">
                Ask a question about Ali
              </label>
              <Textarea
                id="portfolio-question"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault()
                    void sendMessage(draft)
                  }
                }}
                maxLength={1000}
                rows={1}
                disabled={isStreaming}
                placeholder="Ask about experience, projects, skills…"
                className="max-h-32 min-h-9 resize-none border-0 bg-transparent px-2 py-2 text-base text-white shadow-none placeholder:text-white/25 focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 md:text-base dark:disabled:bg-transparent"
              />
              <Button
                type="submit"
                size="icon-lg"
                disabled={!draft.trim() || isStreaming}
                className="rounded-full bg-[#d9ff43] text-[#10100f] hover:bg-white"
                aria-label={
                  isStreaming ? 'Generating response' : 'Send message'
                }
              >
                {isStreaming ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowUp />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
