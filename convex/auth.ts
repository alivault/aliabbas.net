import { createClient } from '@convex-dev/better-auth'
import { convex, crossDomain } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'
import { components } from './_generated/api'
import { query } from './_generated/server'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel } from './_generated/dataModel'

const convexSiteUrl = process.env.CONVEX_SITE_URL!
const siteUrl = process.env.SITE_URL!

// The component client has methods needed for integrating Convex with Better Auth
export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: convexSiteUrl,
    trustedOrigins: [
      'http://localhost:3000',
      siteUrl,
    ].filter(Boolean),
    database: authComponent.adapter(ctx),
    // Enable email/password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    // Enable social login with GitHub (only if credentials are set)
    socialProviders: githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : undefined,
    plugins: [
      crossDomain({ siteUrl }),
      convex(),
    ],
  })
}

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx)
  },
})

