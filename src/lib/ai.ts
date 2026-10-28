import { env } from 'cloudflare:workers'

/**
 * The model behind chat and the claim checker: Claude Haiku 5.5 on the
 * Anthropic API. The system prompt holds the whole knowledge base and is
 * the same for every visitor, so it is cached; a cache read costs a tenth
 * of a normal input token.
 *
 * - Without ANTHROPIC_API_KEY, or when the Anthropic call fails before the
 *   answer starts, the call goes to Workers AI (Llama 3.3 70B) instead.
 * - In local dev with DEV_AI_BRIDGE_URL set, the call goes to
 *   scripts/dev-ai-bridge.ts, which answers with Claude Code on your own
 *   subscription. The check on import.meta.env.DEV removes this path from
 *   production builds.
 *
 * Both functions return what the routes read from Workers AI: a stream of
 * `data: {"response": "..."}` frames, or a parsed JSON object.
 */

const ANTHROPIC_MODEL = 'claude-haiku-5-5'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const WORKERS_AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

type Usage = {
  input_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
  output_tokens?: number
}

/** In dev, log token use, to check that the cache works. */
function logUsage(kind: string, usage: Usage | undefined) {
  if (!import.meta.env.DEV || !usage) return
  console.log(
    `[ai] ${kind}: ${usage.input_tokens ?? 0} in, ${usage.cache_read_input_tokens ?? 0} cache read, ${usage.cache_creation_input_tokens ?? 0} cache write, ${usage.output_tokens ?? 0} out`,
  )
}

type Turn = { role: 'user' | 'assistant'; content: string }
type Effort = 'low' | 'medium' | 'high'

type Environment = {
  ANTHROPIC_API_KEY?: string
  DEV_AI_BRIDGE_URL?: string
}

function settings() {
  const values = env as Environment
  return {
    apiKey: values.ANTHROPIC_API_KEY,
    bridge: import.meta.env.DEV ? values.DEV_AI_BRIDGE_URL : undefined,
  }
}

/** The system prompt as one cached block. */
function cachedSystem(system: string) {
  return [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
}

async function callAnthropic(apiKey: string, body: Record<string, unknown>) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, ...body }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Anthropic API ${response.status}: ${detail.slice(0, 300)}`)
  }
  return response
}

async function callBridge(bridge: string, input: Record<string, unknown>) {
  const response = await fetch(bridge, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok || !response.body) {
    throw new Error(`Dev AI bridge failed: HTTP ${response.status}`)
  }
  return response
}

/**
 * Anthropic's stream events, as Workers AI frames. Only text goes out;
 * thinking deltas are dropped. An error event fails the stream, so the
 * route stores the answer as failed.
 */
function toWorkersAiFrames(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = body.getReader()
  let buffer = ''
  let usage: Usage | undefined

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const boundary = buffer.indexOf('\n\n')
        if (boundary !== -1) {
          const frame = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const data = frame
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n')
          if (!data) continue
          let event: {
            type?: string
            delta?: { type?: string; text?: string }
            error?: { message?: string }
            message?: { usage?: Usage }
            usage?: Usage
          }
          try {
            event = JSON.parse(data)
          } catch {
            continue
          }
          if (event.type === 'message_start') usage = event.message?.usage
          if (event.type === 'message_delta' && event.usage) {
            usage = { ...usage, ...event.usage }
            logUsage('stream', usage)
          }
          if (
            event.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta' &&
            event.delta.text
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ response: event.delta.text })}\n\n`,
              ),
            )
            return
          }
          if (event.type === 'error') {
            controller.error(
              new Error(event.error?.message ?? 'Anthropic stream error'),
            )
            return
          }
          if (event.type === 'message_stop') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            return
          }
          continue
        }
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      }
    },
    cancel(reason) {
      // The visitor stopped the answer: stop the model too.
      return reader.cancel(reason)
    },
  })
}

/** A streamed chat answer. */
export async function streamAnswer(input: {
  system: string
  messages: Array<Turn>
  maxTokens: number
}): Promise<ReadableStream<Uint8Array>> {
  const { apiKey, bridge } = settings()
  const workersAiInput = {
    messages: [{ role: 'system', content: input.system }, ...input.messages],
    max_tokens: input.maxTokens,
    temperature: 0.2,
    stream: true,
  }
  if (bridge) return (await callBridge(bridge, workersAiInput)).body!

  if (apiKey) {
    try {
      const response = await callAnthropic(apiKey, {
        // Thinking counts toward max_tokens, so leave room for it.
        max_tokens: input.maxTokens * 2,
        system: cachedSystem(input.system),
        messages: input.messages,
        output_config: { effort: 'low' satisfies Effort },
        stream: true,
      })
      return toWorkersAiFrames(response.body!)
    } catch (error) {
      console.error('Anthropic request failed, using Workers AI', error)
    }
  }
  return (await env.AI.run(
    WORKERS_AI_MODEL,
    workersAiInput as never,
  )) as ReadableStream<Uint8Array>
}

/** Every object in a structured-output schema must close its properties. */
function closeObjects(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(closeObjects)
  if (!schema || typeof schema !== 'object') return schema
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(schema)) {
    result[key] = closeObjects(value)
  }
  if (result.type === 'object' && !('additionalProperties' in result)) {
    result.additionalProperties = false
  }
  return result
}

/** One JSON answer that matches `schema`. */
export async function generateJson(input: {
  system: string
  user: string
  schema: object
  maxTokens: number
}): Promise<unknown> {
  const { apiKey, bridge } = settings()
  const workersAiInput = {
    messages: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user },
    ],
    max_tokens: input.maxTokens,
    temperature: 0,
    response_format: { type: 'json_schema', json_schema: input.schema },
  }
  if (bridge) {
    const result = (await (
      await callBridge(bridge, workersAiInput)
    ).json()) as {
      response?: unknown
    }
    return result.response
  }

  if (apiKey) {
    try {
      const response = await callAnthropic(apiKey, {
        max_tokens: input.maxTokens * 3,
        system: cachedSystem(input.system),
        messages: [{ role: 'user', content: input.user }],
        output_config: {
          effort: 'medium' satisfies Effort,
          format: { type: 'json_schema', schema: closeObjects(input.schema) },
        },
      })
      const message = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>
        stop_reason?: string
        usage?: Usage
      }
      logUsage('json', message.usage)
      const text = message.content?.find((block) => block.type === 'text')?.text
      if (!text) throw new Error(`No JSON in answer (${message.stop_reason})`)
      return JSON.parse(text) as unknown
    } catch (error) {
      console.error('Anthropic JSON request failed, using Workers AI', error)
    }
  }
  const result = (await env.AI.run(
    WORKERS_AI_MODEL,
    workersAiInput as never,
  )) as unknown
  const response =
    result && typeof result === 'object' && 'response' in result
      ? result.response
      : result
  return typeof response === 'string'
    ? (JSON.parse(response) as unknown)
    : response
}
