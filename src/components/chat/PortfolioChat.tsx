import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, LoaderCircle, UserRound } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import MonoLabel from '~/components/MonoLabel'
import PageHeading from '~/components/PageHeading'
import Title from '~/components/Title'
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

const AnimatedMessageScrollerItem = motion.create(MessageScrollerItem)

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
  questions = suggestedQuestions,
}: {
  className?: string
  disabled: boolean
  onSelect: (question: string) => void
  questions?: ReadonlyArray<string>
}) {
  const reduceMotion = useReducedMotion()

  if (disabled) return null

  return (
    <div className={className}>
      {questions.map((question, index) => (
        <motion.button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 8, scale: 0.9, filter: 'blur(8px)' }
          }
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.22, delay: index * 0.08 },
                  filter: { duration: 0.3, delay: index * 0.08 },
                  y: {
                    type: 'spring',
                    stiffness: 460,
                    damping: 28,
                    delay: index * 0.08,
                  },
                  scale: {
                    type: 'spring',
                    stiffness: 460,
                    damping: 22,
                    delay: index * 0.08,
                  },
                }
          }
          className="border-foreground/15 text-foreground/60 hover:border-brand/60 hover:text-brand max-w-full rounded-[21px] border px-4 py-2 text-left text-base transition-colors disabled:pointer-events-none disabled:opacity-40"
        >
          {question}
        </motion.button>
      ))}
    </div>
  )
}

function QuestionComposer({
  className,
  id,
  isStreaming,
  onChange,
  onSubmit,
  value,
}: {
  className?: string
  id: string
  isStreaming: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  value: string
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className={cn(
        'border-foreground/15 bg-background focus-within:border-brand/60 relative flex items-center gap-2 rounded-[23px] border p-1',
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Ask a question about Ali
      </label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault()
            onSubmit()
          }
        }}
        maxLength={1000}
        rows={1}
        readOnly={isStreaming}
        placeholder={
          isStreaming ? '' : 'Ask about experience, projects, skills…'
        }
        className="text-foreground placeholder:text-foreground/35 max-h-32 min-h-9 resize-none border-0 bg-transparent px-2 py-2 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:cursor-default disabled:bg-transparent disabled:opacity-100 md:text-base dark:bg-transparent dark:disabled:bg-transparent"
      />
      {isStreaming && !value && (
        <span
          role="status"
          className="text-foreground/35 shimmer pointer-events-none absolute top-1/2 right-12 left-3 -translate-y-1/2 truncate text-base"
        >
          Generating response…
        </span>
      )}
      <Button
        type="submit"
        size="icon-lg"
        disabled={!value.trim() || isStreaming}
        className="bg-foreground text-background hover:bg-foreground hover:text-background rounded-full"
        aria-label={isStreaming ? 'Generating response' : 'Send message'}
      >
        {isStreaming ? <LoaderCircle className="animate-spin" /> : <ArrowUp />}
      </Button>
    </form>
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
            <Title as="h1" variant="card" className="text-foreground">
              {children}
            </Title>
          ),
          h2: ({ children }) => (
            <Title as="h2" variant="subsection" className="text-foreground">
              {children}
            </Title>
          ),
          h3: ({ children }) => (
            <Title as="h3" variant="detail" className="text-foreground">
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
          ul: ({ children }) => (
            <ul className="marker:text-brand list-disc space-y-1 pl-5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="marker:text-brand list-decimal space-y-1 pl-5">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-brand/60 text-foreground/55 border-l pl-4">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => (
            <code
              className={cn(
                'rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.85em] text-brand',
                className,
              )}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="border-foreground/10 bg-muted overflow-x-auto rounded-lg border p-3 text-xs leading-6 [&_code]:bg-transparent [&_code]:p-0">
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
            <th className="border-foreground/20 text-foreground border-b px-3 py-2 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-foreground/10 border-b px-3 py-2 align-top">
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
          className="bg-brand size-1.5 animate-pulse rounded-full"
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
  const reduceMotion = useReducedMotion()
  const [messages, setMessages] = useState<Array<ChatMessage>>([welcomeMessage])
  const [draft, setDraft] = useState('')
  const [conversation] = useState<ConversationIdentity>(
    createConversationIdentity,
  )
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

  const isStreaming = requestState.status === 'streaming'
  const hasConversation = messages.length > 1
  const askedQuestions = new Set(
    messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content.trim().toLowerCase()),
  )
  const unusedQuestions = suggestedQuestions.filter(
    (question) => !askedQuestions.has(question.toLowerCase()),
  )

  return (
    <div className="flex h-[calc(100svh-72px)] min-h-0 min-w-0 flex-col overflow-hidden">
      {!hasConversation && (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-end justify-start overflow-y-auto px-4 py-8 sm:px-6 sm:py-10 lg:items-center lg:justify-center lg:py-12">
            <div className="flex w-full max-w-3xl flex-col items-start lg:items-center">
              <PageHeading className="text-left lg:text-center">
                Ask about <em className="text-brand">Ali.</em>
              </PageHeading>
              <div className="mt-10 hidden w-full lg:block">
                <QuestionComposer
                  id="portfolio-question-initial"
                  value={draft}
                  isStreaming={isStreaming}
                  onChange={setDraft}
                  onSubmit={() => void sendMessage(draft)}
                />
              </div>
              <div className="mt-8 w-full">
                <MonoLabel className="text-left lg:text-center">
                  Try asking
                </MonoLabel>
                <SuggestedQuestionButtons
                  disabled={isStreaming}
                  onSelect={(question) => void sendMessage(question)}
                  className="mt-4 flex flex-wrap justify-start gap-2 lg:justify-center"
                />
              </div>
            </div>
          </div>
          <div className="shrink-0 p-3 sm:p-4 lg:hidden">
            <QuestionComposer
              id="portfolio-question-initial-mobile"
              value={draft}
              isStreaming={isStreaming}
              onChange={setDraft}
              onSubmit={() => void sendMessage(draft)}
            />
          </div>
        </section>
      )}

      <div
        className={cn(
          'size-full min-h-0 min-w-0 flex-col overflow-hidden',
          hasConversation ? 'flex' : 'hidden',
        )}
      >
        <MessageScrollerProvider scrollPreviousItemPeek={48}>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport className="px-4 py-6 sm:px-6 sm:py-8">
              <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-7">
                {messages
                  .filter((message) => message.id !== 'welcome')
                  .map((message) => (
                    <AnimatedMessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.role === 'user'}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
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
                              ? 'border border-foreground/15 text-brand'
                              : 'bg-brand text-brand-foreground',
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
                              ? 'pt-0.5 text-foreground/70'
                              : 'rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5 text-brand-foreground',
                          )}
                        >
                          {message.content ? (
                            message.role === 'assistant' ? (
                              <MessageText content={message.content} />
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
                    </AnimatedMessageScrollerItem>
                  ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton
              size="icon-lg"
              className="border-foreground/15 bg-background/80 text-foreground hover:bg-brand hover:text-brand-foreground rounded-full backdrop-blur-[12px] backdrop-saturate-[1.8]"
            />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className="shrink-0 px-3 pb-5 sm:px-4 sm:pb-6">
          <div className="mx-auto w-full max-w-3xl">
            {requestState.status === 'error' && (
              <p role="alert" className="mb-3 text-xs text-[#ff8b75]">
                {requestState.message}
              </p>
            )}
            {unusedQuestions.length > 0 && (
              <SuggestedQuestionButtons
                questions={unusedQuestions}
                disabled={isStreaming}
                onSelect={(question) => void sendMessage(question)}
                className="mb-3 flex flex-wrap gap-2"
              />
            )}
            <QuestionComposer
              id="portfolio-question"
              value={draft}
              isStreaming={isStreaming}
              onChange={setDraft}
              onSubmit={() => void sendMessage(draft)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
