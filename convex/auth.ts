import { createClient } from '@convex-dev/better-auth'
import { convex, crossDomain } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'
import { Resend } from 'resend'
import { query } from './_generated/server'
import { components } from './_generated/api'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel } from './_generated/dataModel'

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  const convexSiteUrl = process.env.CONVEX_SITE_URL!
  const siteUrl = process.env.SITE_URL!
  const githubClientId = process.env.GITHUB_CLIENT_ID
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: convexSiteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const result = await resend.emails.send({
          from: 'Ali Abbas <noreply@mail.aliabbas.dev>',
          to: user.email,
          subject: 'Reset your password',
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="margin-bottom: 24px; color: #171717;">
                Reset your password
              </h2>
              <p style="color: #525252; margin-bottom: 24px;">
                Click the button below to reset your password. This link expires in 1 hour.
              </p>
              <a href="${url}" style="display: inline-block; background: #171717; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Reset Password
              </a>
              <p style="color: #737373; font-size: 14px; margin-top: 24px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        })

        if (result.error) {
          throw new Error('Failed to send reset password email')
        }
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
    },
    socialProviders:
      githubClientId && githubClientSecret
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
      emailOTP({
        sendVerificationOTP: async ({ email, otp, type }) => {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const result = await resend.emails.send({
            from: 'Ali Abbas <noreply@mail.aliabbas.dev>',
            to: email,
            subject:
              type === 'sign-in'
                ? `Your sign-in code is ${otp}`
                : `Your verification code is ${otp}`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
                <h2 style="margin-bottom: 24px; color: #171717;">
                  ${type === 'sign-in' ? 'Your sign-in code' : 'Verify your email'}
                </h2>
                <p style="color: #525252; margin-bottom: 24px;">
                  ${type === 'sign-in' ? 'Use this code to sign in to your account:' : 'Use this code to verify your email address:'}
                </p>
                <div style="background: #f5f5f5; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #171717;">
                    ${otp}
                  </span>
                </div>
                <p style="color: #737373; font-size: 14px;">
                  This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.
                </p>
              </div>
            `,
          })

          if (result.error) {
            throw new Error('Failed to send verification email')
          }
        },
      }),
    ],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx)
  },
})
