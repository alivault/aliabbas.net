/**
 * Local dev only: answers Workers AI calls with Claude Code, on your own
 * Claude subscription, so local testing does not use the daily Workers AI
 * allocation that the live site needs.
 *
 *   vp run dev:ai          # this bridge, on http://127.0.0.1:8790
 *   vp dev --port 3000     # with DEV_AI_BRIDGE_URL in .dev.vars
 *
 * It takes the body of an `env.AI.run()` call (messages, stream,
 * response_format) and returns what Workers AI returns: an SSE stream of
 * `{"response": "..."}` frames, or `{"response": <object>}` for JSON mode.
 * Claude Code runs with no tools, no MCP servers, no settings and no saved
 * session, in an empty directory.
 *
 * Environment: DEV_AI_PORT (8790), DEV_AI_MODEL (claude-haiku-5-5).
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

const PORT = Number(process.env.DEV_AI_PORT ?? 8790)
const MODEL = process.env.DEV_AI_MODEL ?? 'claude-haiku-5-5'
const WORK_DIR = mkdtempSync(join(tmpdir(), 'dev-ai-bridge-'))

type Message = { role: 'system' | 'user' | 'assistant'; content: string }
type RunInput = {
  messages: Array<Message>
  stream?: boolean
  response_format?: { type: string; json_schema?: unknown }
}

/** Claude Code takes one prompt, so earlier turns go into it as a transcript. */
function toPrompt(messages: Array<Message>) {
  const turns = messages.filter((message) => message.role !== 'system')
  if (turns.length === 1) return turns[0]!.content
  const history = turns
    .slice(0, -1)
    .map(
      (message) => `<${message.role}>\n${message.content}\n</${message.role}>`,
    )
    .join('\n')
  return `<conversation>\n${history}\n</conversation>\n\nAnswer the next user message. Follow the system prompt.\n\n${turns.at(-1)!.content}`
}

function claude(input: RunInput, extra: Array<string>) {
  const system = input.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n')
  const systemFile = join(WORK_DIR, `system-${process.hrtime.bigint()}.txt`)
  writeFileSync(systemFile, system)
  return spawn(
    'claude',
    [
      '-p',
      toPrompt(input.messages),
      '--model',
      MODEL,
      '--system-prompt-file',
      systemFile,
      '--tools',
      '',
      '--strict-mcp-config',
      '--setting-sources',
      '',
      '--no-session-persistence',
      ...extra,
    ],
    { cwd: WORK_DIR, stdio: ['ignore', 'pipe', 'pipe'] },
  )
}

async function readBody(request: IncomingMessage) {
  const chunks: Array<Buffer> = []
  for await (const chunk of request) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as RunInput
}

function stream(input: RunInput, response: ServerResponse) {
  const child = claude(input, [
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
  ])
  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  })
  // The Stop button closes the request: stop Claude Code too.
  response.on('close', () => child.kill())
  const lines = createInterface({ input: child.stdout })
  lines.on('line', (line) => {
    let event: {
      type?: string
      is_error?: boolean
      result?: string
      event?: { type?: string; delta?: { type?: string; text?: string } }
    }
    try {
      event = JSON.parse(line)
    } catch {
      return
    }
    const delta = event.event?.delta
    if (
      event.type === 'stream_event' &&
      event.event?.type === 'content_block_delta' &&
      delta?.type === 'text_delta' &&
      delta.text
    ) {
      response.write(`data: ${JSON.stringify({ response: delta.text })}\n\n`)
    }
    if (event.type === 'result' && event.is_error) {
      console.error('[dev-ai] Claude Code error:', event.result)
    }
  })
  child.stderr.on('data', (data: Buffer) =>
    console.error('[dev-ai]', data.toString().trim()),
  )
  child.on('close', () => {
    if (!response.writableEnded) response.end('data: [DONE]\n\n')
  })
}

function json(input: RunInput, response: ServerResponse) {
  const schema = input.response_format?.json_schema
  const child = claude(input, [
    '--output-format',
    'json',
    ...(schema ? ['--json-schema', JSON.stringify(schema)] : []),
  ])
  let out = ''
  child.stdout.on('data', (data: Buffer) => (out += data.toString()))
  child.stderr.on('data', (data: Buffer) =>
    console.error('[dev-ai]', data.toString().trim()),
  )
  child.on('close', () => {
    try {
      const result = JSON.parse(out) as {
        is_error?: boolean
        result?: string
        structured_output?: unknown
      }
      if (result.is_error) throw new Error(result.result)
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(
        JSON.stringify({ response: result.structured_output ?? result.result }),
      )
    } catch (error) {
      console.error('[dev-ai] JSON call failed:', error)
      response.writeHead(502, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: String(error) }))
    }
  })
}

createServer(async (request, response) => {
  if (request.method !== 'POST') {
    response.writeHead(405).end()
    return
  }
  try {
    const input = await readBody(request)
    const mode = input.stream ? 'stream' : 'json'
    console.log(`[dev-ai] ${mode} call, ${input.messages.length} messages`)
    if (input.stream) stream(input, response)
    else json(input, response)
  } catch (error) {
    response.writeHead(400).end(String(error))
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[dev-ai] Claude Code (${MODEL}) on http://127.0.0.1:${PORT}`)
})
