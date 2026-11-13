import { useState } from 'react'
import {
  useQuery as useTanstackQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '~/components/ui/input-otp'
import type { Id } from '../../../convex/_generated/dataModel'
import { authClient } from '~/lib/auth-client'
import { sessionQueryKey, sessionQueryOptions } from '~/lib/auth'
import { formatDistanceToNow } from '~/lib/getFormattedDate'
import { cn } from '~/lib/utils'
import Shimmer from '~/components/ui/shimmer'
import { Line, ReaderSection, hudText } from './Reader'

/** A short action in the HUD face. */
const action = cn(hudText, 'hud-fill uppercase disabled:opacity-50')

/** A text field with a line under it, as on the contact page. */
const field =
  'border-hud/40 focus:border-hud placeholder:text-hud/45 text-foreground w-full border-b bg-transparent py-3 text-base outline-none transition-colors'

type AuthMode =
  | 'options'
  | 'email'
  | 'verify-signup'
  | 'verify-unverified'
  | 'forgot-password'
  | 'reset-sent'

/**
 * The comments of a note, in the style of the readers. A visitor signs in
 * with GitHub or with an email address (with a code to check it), then
 * writes. Each person can rename themselves and delete their own comments.
 */
export default function NoteComments({ articleSlug }: { articleSlug: string }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [authMode, setAuthMode] = useState<AuthMode>('options')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  const queryClient = useQueryClient()
  const router = useRouter()
  const comments = useQuery(api.comments.getComments, { articleSlug })
  const addComment = useMutation(api.comments.addComment)
  const deleteComment = useMutation(api.comments.deleteComment)
  const updateUserName = useMutation(api.comments.updateUserName)

  const { isPending: isSessionLoading } = useTanstackQuery(sessionQueryOptions)
  const { data: session } = authClient.useSession()
  const user = session?.user

  /** The session changed: update the cache and the route guards. */
  const refreshSession = async () => {
    await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    await router.invalidate()
  }

  const resetAuthForm = () => {
    setAuthMode('options')
    setEmail('')
    setPassword('')
    setName('')
    setAuthError('')
    setOtp('')
  }

  const handleSignOut = async () => {
    // Clear the cached session first, so the form does not flash.
    queryClient.setQueryData(sessionQueryKey, {
      userId: undefined,
      token: undefined,
    })
    await authClient.signOut()
    await refreshSession()
  }

  const handleSaveName = async () => {
    const trimmed = editedName.trim()
    if (!trimmed) return
    setIsUpdatingName(true)
    try {
      await authClient.updateUser({ name: trimmed })
      // The name on the comments that this person already wrote, too.
      await updateUserName({ newName: trimmed })
      setIsEditingName(false)
    } catch {
      // The name stays as it was.
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault()
    setAuthError('')
    setIsAuthLoading(true)
    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name || email.split('@')[0],
        })
        if (result.error) {
          setAuthError(result.error.message || 'Sign up failed.')
          return
        }
        // A new account checks its address with a code.
        const sent = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: 'email-verification',
        })
        if (sent.error) {
          setAuthError(sent.error.message || 'The code was not sent.')
        } else {
          setAuthMode('verify-signup')
        }
      } else {
        await authClient.signIn.email(
          { email, password, callbackURL: window.location.href },
          {
            onSuccess: async () => {
              await refreshSession()
              resetAuthForm()
            },
            onError: (context) => {
              setAuthError(context.error.message || 'Sign in failed.')
            },
          },
        )
      }
    } catch {
      setAuthError('Something went wrong. Try again.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return
    setIsVerifyingOtp(true)
    setAuthError('')
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp })
      if (result.error) {
        setAuthError(result.error.message || 'The code is not correct.')
        setOtp('')
      } else {
        await refreshSession()
        resetAuthForm()
      }
    } catch {
      setAuthError('Something went wrong. Try again.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const sendCode = async (to: string, then?: () => void) => {
    setIsSendingOtp(true)
    setAuthError('')
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: to,
        type: 'email-verification',
      })
      if (result.error) {
        setAuthError(result.error.message || 'The code was not sent.')
      } else {
        then?.()
      }
    } catch {
      setAuthError('Something went wrong. Try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setIsResetLoading(true)
    setAuthError('')
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (result.error) {
        setAuthError(result.error.message || 'The email was not sent.')
      } else {
        setAuthMode('reset-sent')
      }
    } catch {
      setAuthError('Something went wrong. Try again.')
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await addComment({ articleSlug, content: content.trim() })
      setContent('')
    } catch {
      // The text stays in the field, so the visitor can try again.
    } finally {
      setIsSubmitting(false)
    }
  }

  const error = authError ? (
    <p role="alert" className="text-destructive text-sm">
      {authError}
    </p>
  ) : null

  /** The six boxes of a code from the email, and its actions. */
  const codeForm = (onBack: () => void, submitLabel: string) => (
    <div className="flex flex-col gap-6">
      <p className="text-fg-secondary text-base leading-7">
        Enter the 6-digit code that went to{' '}
        <span className="text-foreground">{email}</span>.
      </p>
      <InputOTP
        maxLength={6}
        value={otp}
        onChange={setOtp}
        onComplete={handleVerifyOtp}
        disabled={isVerifyingOtp}
        aria-label="Code from the email"
      >
        <InputOTPGroup className="gap-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className="border-hud/40 data-[active=true]:border-hud size-11 rounded-none border text-base first:rounded-none last:rounded-none data-[active=true]:ring-0"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error}
      <div className="flex flex-wrap gap-x-10 gap-y-2">
        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={otp.length !== 6 || isVerifyingOtp}
          className={action}
        >
          {isVerifyingOtp ? 'Checking' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => void sendCode(email)}
          disabled={isSendingOtp}
          className={action}
        >
          {isSendingOtp ? 'Sending' : 'Send again'}
        </button>
        <button type="button" onClick={onBack} className={action}>
          Cancel
        </button>
      </div>
    </div>
  )

  const signedOut = () => {
    switch (authMode) {
      case 'options':
        return (
          <div className="flex flex-col gap-4">
            <p className="text-fg-secondary text-base leading-7">
              Sign in to write a comment.
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-2">
              <button
                type="button"
                disabled={isGithubLoading}
                onClick={() => {
                  setIsGithubLoading(true)
                  void authClient.signIn.social({
                    provider: 'github',
                    callbackURL: window.location.href,
                  })
                }}
                className={action}
              >
                {isGithubLoading ? 'Opening GitHub' : 'Sign in with GitHub'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('email')}
                className={action}
              >
                Sign in with email
              </button>
            </div>
          </div>
        )
      case 'verify-signup':
        return codeForm(() => {
          setAuthMode('email')
          setOtp('')
          setAuthError('')
        }, 'Check and continue')
      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
            <p className="text-fg-secondary text-base leading-7">
              Enter your email. A link to set a new password goes to it.
            </p>
            <label htmlFor="comment-reset-email" className="sr-only">
              Email
            </label>
            <input
              id="comment-reset-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={field}
            />
            {error}
            <div className="flex flex-wrap gap-x-10 gap-y-2">
              <button
                type="submit"
                disabled={isResetLoading || !email.trim()}
                className={action}
              >
                {isResetLoading ? 'Sending' : 'Send the link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email')
                  setAuthError('')
                }}
                className={action}
              >
                Cancel
              </button>
            </div>
          </form>
        )
      case 'reset-sent':
        return (
          <div className="flex flex-col gap-4">
            <p className="text-fg-secondary text-base leading-7">
              If an account exists for{' '}
              <span className="text-foreground">{email}</span>, a link to set a
              new password is on its way.
            </p>
            <button
              type="button"
              onClick={resetAuthForm}
              className={cn(action, 'self-start')}
            >
              Back to sign in
            </button>
          </div>
        )
      case 'email':
        return (
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-6">
            <p className={hudText}>
              {isSignUp ? 'Create an account' : 'Sign in'}
            </p>
            {isSignUp ? (
              <>
                <label htmlFor="comment-name" className="sr-only">
                  Name (optional)
                </label>
                <input
                  id="comment-name"
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={field}
                />
              </>
            ) : null}
            <label htmlFor="comment-email" className="sr-only">
              Email
            </label>
            <input
              id="comment-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={field}
            />
            <label htmlFor="comment-password" className="sr-only">
              Password
            </label>
            <input
              id="comment-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className={field}
            />
            {error}
            <div className="flex flex-wrap gap-x-10 gap-y-2">
              <button type="submit" disabled={isAuthLoading} className={action}>
                {isAuthLoading ? 'Wait' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setAuthError('')
                }}
                className={action}
              >
                {isSignUp ? 'I have an account' : 'Create an account'}
              </button>
              {isSignUp ? null : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot-password')
                    setAuthError('')
                  }}
                  className={action}
                >
                  Forgot password
                </button>
              )}
              <button type="button" onClick={resetAuthForm} className={action}>
                Cancel
              </button>
            </div>
          </form>
        )
      default:
        return null
    }
  }

  const signedIn = () => {
    if (!user) return null
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          {isEditingName ? (
            <div className="flex min-w-0 flex-1 items-end gap-8">
              <label htmlFor="comment-display-name" className="sr-only">
                Your name
              </label>
              <input
                id="comment-display-name"
                type="text"
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleSaveName()
                  if (event.key === 'Escape') {
                    // Esc leaves the field, not the page.
                    event.preventDefault()
                    setIsEditingName(false)
                  }
                }}
                className={cn(field, 'max-w-64')}
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isUpdatingName || !editedName.trim()}
                className={action}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className={action}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <p className="text-fg-secondary text-base">
                Signed in as{' '}
                <span className="text-foreground">
                  {user.name || user.email}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditedName(user.name || '')
                  setIsEditingName(true)
                }}
                className={action}
              >
                Edit name
              </button>
              <button type="button" onClick={handleSignOut} className={action}>
                Sign out
              </button>
            </>
          )}
        </div>

        {!user.emailVerified ? (
          authMode === 'verify-unverified' ? (
            codeForm(() => {
              setAuthMode('options')
              setOtp('')
              setAuthError('')
            }, 'Check the email')
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-fg-secondary text-base leading-7">
                Check your email address to write comments: a code goes to it.
              </p>
              <button
                type="button"
                disabled={isSendingOtp}
                onClick={() => {
                  if (!user.email) return
                  const to = user.email
                  void sendCode(to, () => {
                    setEmail(to)
                    setAuthMode('verify-unverified')
                  })
                }}
                className={cn(action, 'self-start')}
              >
                {isSendingOtp ? 'Sending' : 'Send the code'}
              </button>
              {error}
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <label htmlFor="comment-text" className="sr-only">
              Your comment
            </label>
            <textarea
              id="comment-text"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write a comment"
              rows={3}
              className={cn(field, 'field-sizing-content min-h-24 resize-none')}
            />
            <button
              type="submit"
              data-sound="send"
              disabled={!content.trim() || isSubmitting}
              className={cn(action, 'self-start')}
            >
              {isSubmitting ? 'Posting' : 'Post'}
            </button>
          </form>
        )}
      </div>
    )
  }

  const count = comments?.length ?? 0

  return (
    <ReaderSection title={count ? `Comments (${count})` : 'Comments'}>
      <Line className="mt-8 max-w-[60ch]">
        {isSessionLoading ? (
          <p className={hudText}>
            <Shimmer>Loading</Shimmer>
          </p>
        ) : user ? (
          signedIn()
        ) : (
          signedOut()
        )}
      </Line>

      <Line className="mt-12 max-w-[60ch]">
        {comments === undefined ? (
          <p className={hudText}>
            <Shimmer>Loading</Shimmer>
          </p>
        ) : comments.length === 0 ? (
          <p className="text-fg-muted text-base">No comments yet.</p>
        ) : (
          <ol className="flex flex-col">
            {comments.map((comment) => (
              <li
                key={comment._id}
                className="border-hud/15 border-t py-6 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center gap-3">
                  {comment.userImage ? (
                    <img
                      src={comment.userImage}
                      alt=""
                      className="border-hud/30 size-8 border"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={cn(
                        hudText,
                        'border-hud/30 flex size-8 items-center justify-center border tracking-normal',
                      )}
                    >
                      {comment.userName[0]?.toUpperCase()}
                    </span>
                  )}
                  <p className="text-foreground text-sm font-medium">
                    {comment.userName}
                  </p>
                  <p className="text-fg-muted text-sm">
                    {formatDistanceToNow(comment.createdAt)}
                  </p>
                  {user && user.id === comment.userId ? (
                    <button
                      type="button"
                      onClick={() =>
                        void deleteComment({
                          commentId: comment._id as Id<'comments'>,
                        })
                      }
                      className={cn(action, 'ml-auto')}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <p className="text-fg-secondary mt-3 text-base leading-7 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Line>
    </ReaderSection>
  )
}
