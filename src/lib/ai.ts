import { env } from 'cloudflare:workers'

/**
 * `env.AI.run()`, but in local dev with DEV_AI_BRIDGE_URL set it goes to
 * scripts/dev-ai-bridge.ts, which answers with Claude Code on your own
 * subscription. Production builds always use Workers AI: the check on
 * import.meta.env.DEV removes the bridge path from them.
 */
export async function runAi(
  model: Parameters<typeof env.AI.run>[0],
  input: Record<string, unknown>,
): Promise<unknown> {
  const bridge = import.meta.env.DEV
    ? (env as { DEV_AI_BRIDGE_URL?: string }).DEV_AI_BRIDGE_URL
    : undefined
  if (!bridge) return env.AI.run(model, input as never)

  const response = await fetch(bridge, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok || !response.body) {
    throw new Error(`Dev AI bridge failed: HTTP ${response.status}`)
  }
  return input.stream ? response.body : response.json()
}
