import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** One SSE event, sent after `delay` milliseconds. */
export type Frame = { delay: number; event: Record<string, unknown> }
export type Streams = Partial<Record<'/api/chat' | '/api/check', Array<Frame>>>

/**
 * Replace `fetch` for the AI routes with a stream that sends each frame after
 * its delay and stops when the request is aborted. `route.fulfill` sends the
 * whole body at once, so it cannot test a stop in the middle of an answer.
 */
export async function mockAi(page: Page, streams: Streams) {
  await page.addInitScript((scripts: Streams) => {
    const realFetch = window.fetch.bind(window)
    const requests: Array<{ path: string; body: unknown }> = []
    Object.assign(window, { __aiRequests: requests })

    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const path = new URL(url, location.href).pathname as keyof Streams
      const frames = scripts[path]
      if (!frames) return realFetch(input, init)

      requests.push({
        path,
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
      })
      const encoder = new TextEncoder()
      const signal = init?.signal
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          signal?.addEventListener('abort', () => {
            controller.error(new DOMException('Aborted', 'AbortError'))
          })
          for (const { delay, event } of frames) {
            await new Promise((resolve) => setTimeout(resolve, delay))
            if (signal?.aborted) return
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            )
          }
          controller.close()
        },
      })
      return Promise.resolve(
        new Response(body, {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      )
    }
  }, streams)
}

export const SOURCES = {
  pico: {
    id: 'S19',
    title: 'Pico, a local-first developer tool',
    group: 'Projects',
    body: 'One Node server hosts the agent runtime and serves the React web app.',
  },
  whimcall: {
    id: 'S20',
    title: 'Whimcall, a voice app',
    group: 'Projects',
    body: 'Whimcall streams speech to a model and back.',
  },
}

/** An answer with two cited sources, one word per frame. */
export function chatAnswer(delay = 20): Array<Frame> {
  const words =
    'Yes. Ali built Pico [S19] and Whimcall [S20], which both stream answers.'.split(
      /(?<= )/,
    )
  return [
    { delay, event: { type: 'source', source: SOURCES.pico } },
    { delay: 0, event: { type: 'source', source: SOURCES.whimcall } },
    ...words.map((text) => ({ delay, event: { type: 'delta', text } })),
    { delay, event: { type: 'done' } },
  ]
}

/** Errors that the page logs, so a test can fail on them. */
export const test = base.extend<{ pageErrors: Array<string> }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: Array<string> = []
      page.on('pageerror', (error) => errors.push(error.message))
      await use(errors)
      expect(errors, 'uncaught errors in the page').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/**
 * Open a page and wait until React has hydrated it. Input before hydration
 * is lost, because hydration resets the controlled fields.
 */
export async function open(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    return (
      !!main && Object.keys(main).some((key) => key.startsWith('__reactFiber'))
    )
  })
}

export const isDesktop = (page: Page) =>
  (page.viewportSize()?.width ?? 0) >= 1024
