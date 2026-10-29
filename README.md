# aliabbas.net

The portfolio of Ali Abbas, senior frontend engineer for interactive and
streaming interfaces. The site is also the work sample: its chat, claim
checker and Lab run on the code in this repository.

Live: [aliabbas.net](https://aliabbas.net)

## What to look at

| Surface                                            | What it shows                                                                                                                             | Start here                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`/chat`](https://aliabbas.net/chat)               | A streamed answer with citations checked on the server, and an evidence panel beside it. Stop, retry, edit and resend.                    | [`chat-machine.ts`](src/lib/chat/chat-machine.ts), [`citation-filter.ts`](src/lib/chat/citation-filter.ts), [`api.chat.ts`](src/routes/api.chat.ts) |
| [`/check`](https://aliabbas.net/check)             | A claim is split into parts, and each part gets one of five grades with quotes. The server checks each quote word for word.               | [`check-machine.ts`](src/lib/check/check-machine.ts), [`evidence.ts`](src/lib/check/evidence.ts), [`api.check.ts`](src/routes/api.check.ts)         |
| [`/lab`](https://aliabbas.net/lab)                 | Streaming list, citation drawer, fluid resizer and a move that keeps state, as live specimens with every state forced from a control bar. | [`src/components/lab`](src/components/lab), [`fake-stream.ts`](src/lib/lab/fake-stream.ts)                                                          |
| [`/performance`](https://aliabbas.net/performance) | Core Web Vitals from real visits, and before/after numbers from performance work.                                                         | [`vitals.ts`](src/lib/vitals.ts), [`api.vitals.ts`](src/routes/api.vitals.ts)                                                                       |

Some parts that took the most care:

- **Streaming without layout jumps.** [`streaming-markdown.ts`](src/lib/chat/streaming-markdown.ts)
  splits the answer into blocks, so only the last block parses again on
  each token.
- **Citations that a token can split.** The citation filter holds back a
  tail such as `[S` until it knows if it becomes a marker, and drops ids
  that are not in the knowledge base.
- **A source before its citation.** The server sends each source event
  before the first text that cites it, so the client never shows a chip
  without evidence ([`protocol.ts`](src/lib/chat/protocol.ts)).
- **Interruption.** Every stream event carries the attempt it belongs to.
  The reducer ignores events from an attempt that is not active, so a
  stopped answer cannot write into a new one.
- **The evidence panel.** A resizable panel with a spring collapse, a
  sticky header, and a scroll that puts the chosen source in view after
  the cards around it resize ([`reveal-source.ts`](src/lib/chat/reveal-source.ts)).
  On a phone, the same panel is a drawer with snap points.

## Stack

- TanStack Start, React 19 and TypeScript (strict)
- Vite+ for development, builds, formatting, linting and type checking
- Tailwind CSS 4, shadcn/ui `base-nova` on Base UI, Motion
- Cloudflare Workers, D1 and rate limiting; Convex and Better Auth for
  comments; Sanity for notes and experience
- Claude Haiku 5.5 for chat and the claim checker, with a cached system
  prompt; Workers AI as fallback ([`ai.ts`](src/lib/ai.ts))

## Commands

```bash
vp install       # Install dependencies
vp dev           # Start the development server on http://localhost:3000
vp check         # Format, lint and type-check
vp check --fix   # Fix formatting and lint issues
vp build         # Create a production build
vp run deploy    # Build and deploy with Wrangler
```

A push to `master` checks, builds and deploys the site through GitHub
Actions.

## AI in local development

Put the keys in `.env.local` (not in git):

```bash
ANTHROPIC_API_KEY=sk-ant-...                # the Anthropic API
DEV_AI_BRIDGE_URL=http://127.0.0.1:8790     # optional, see below
```

With `DEV_AI_BRIDGE_URL` set, chat and the checker go to
[`scripts/dev-ai-bridge.ts`](scripts/dev-ai-bridge.ts) instead
(`vp run dev:ai`). It answers with Claude Code on your own subscription,
so local testing does not use the API. Production builds remove this path.

In production, the key is a Worker secret:

```bash
vp exec wrangler secret put ANTHROPIC_API_KEY
```

## Chat administration

Stored chat conversations are at `/admin/conversations`. Access uses the
Better Auth accounts plus the `ADMIN_EMAILS` Worker secret, a
comma-separated list:

```bash
vp exec wrangler secret put ADMIN_EMAILS
```

Apply D1 migrations locally and remotely after you add one:

```bash
vp exec wrangler d1 migrations apply ali-chat-conversations --local
vp exec wrangler d1 migrations apply ali-chat-conversations --remote
```

## Link preview

`public/og-image.png` is rendered from
[`scripts/og-image.html`](scripts/og-image.html) with
`node scripts/og-image.ts`.
