import { env } from 'cloudflare:workers'
import { api } from '../../convex/_generated/api'
import { fetchAuthQuery } from './auth-server'

type AdminEnvironment = Env & {
  ADMIN_EMAILS?: string
}

export type AdminAccess =
  | { status: 'authorized'; email: string; name: string | null }
  | { status: 'unauthenticated' }
  | { status: 'forbidden' }
  | { status: 'unconfigured' }

export async function getAdminAccess(): Promise<AdminAccess> {
  const configuredEmails = (env as AdminEnvironment).ADMIN_EMAILS?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (!configuredEmails?.length) {
    return { status: 'unconfigured' }
  }

  try {
    const user = await fetchAuthQuery(api.auth.getCurrentUser)
    if (!user) return { status: 'unauthenticated' }

    if (!configuredEmails.includes(user.email.toLowerCase())) {
      return { status: 'forbidden' }
    }

    return {
      status: 'authorized',
      email: user.email,
      name: user.name ?? null,
    }
  } catch {
    return { status: 'unauthenticated' }
  }
}
