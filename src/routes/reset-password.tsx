import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { authClient } from '~/lib/auth-client'
import { Button } from '~/components/ui/button'
import Logo from '~/components/Logo'
import PageHeading from '~/components/PageHeading'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })
      if (result.error) {
        setError(result.error.message || 'Failed to reset password')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const BrandHeader = () => (
    <Link to="/" className="mb-8 flex items-center justify-center gap-2">
      <Logo className="text-brand size-8" />
      <span className="text-sm font-semibold">Ali Abbas</span>
    </Link>
  )

  if (!token) {
    return (
      <div className="bg-background text-foreground flex min-h-svh items-center justify-center p-5">
        <div className="border-foreground/15 w-full max-w-md border p-8 text-center">
          <BrandHeader />
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <XCircle className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <PageHeading size="compact" className="mb-2">
            Invalid reset link
          </PageHeading>
          <p className="text-foreground/45 mb-5 text-sm">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate({ to: '/' })} variant="outline">
            Go to homepage
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-background text-foreground flex min-h-svh items-center justify-center p-5">
        <div className="border-foreground/15 w-full max-w-md border p-8 text-center">
          <BrandHeader />
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <PageHeading size="compact" className="mb-2">
            Password reset!
          </PageHeading>
          <p className="text-foreground/45 mb-5 text-sm">
            Your password has been successfully reset. You can now sign in with
            your new password.
          </p>
          <Button onClick={() => navigate({ to: '/' })}>Go to homepage</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground flex min-h-svh items-center justify-center p-5">
      <div className="border-foreground/15 w-full max-w-md border p-8">
        <BrandHeader />
        <PageHeading size="compact" className="mb-2 text-center">
          Reset your password
        </PageHeading>
        <p className="text-foreground/45 mb-6 text-center text-sm">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="border-foreground/15 bg-foreground/5 text-foreground placeholder:text-foreground/30 focus:border-brand w-full border px-3 py-3 text-sm focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="border-foreground/15 bg-foreground/5 text-foreground placeholder:text-foreground/30 focus:border-brand w-full border px-3 py-3 text-sm focus:outline-none"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
