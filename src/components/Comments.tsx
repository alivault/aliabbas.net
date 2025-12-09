import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { authClient } from '~/lib/auth-client'
import { Button } from './ui/button'
import { formatDistanceToNow } from '~/lib/getFormattedDate'
import { Trash2, Github, LogOut, MessageCircle, Mail, Pencil, Check, X } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'

interface CommentsProps {
  articleSlug: string
}

export function Comments({ articleSlug }: CommentsProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Email auth state
  const [authMode, setAuthMode] = useState<'options' | 'email'>('options')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  const comments = useQuery(api.comments.getComments, { articleSlug })
  const addComment = useMutation(api.comments.addComment)
  const deleteComment = useMutation(api.comments.deleteComment)
  const updateUserName = useMutation(api.comments.updateUserName)

  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const user = session?.user

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: window.location.href,
    })
  }

  const handleSignOut = async () => {
    await authClient.signOut()
  }

  const handleStartEditName = () => {
    setEditedName(user?.name || '')
    setIsEditingName(true)
  }

  const handleCancelEditName = () => {
    setIsEditingName(false)
    setEditedName('')
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) return
    setIsUpdatingName(true)
    try {
      const trimmedName = editedName.trim()
      await authClient.updateUser({ name: trimmedName })
      // Update name on all existing comments
      await updateUserName({ newName: trimmedName })
      setIsEditingName(false)
      setEditedName('')
    } catch (error) {
      console.error('Failed to update name:', error)
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
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
          setAuthError(result.error.message || 'Sign up failed')
        } else {
          resetAuthForm()
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        })
        if (result.error) {
          setAuthError(result.error.message || 'Sign in failed')
        } else {
          resetAuthForm()
        }
      }
    } catch (err) {
      setAuthError('An unexpected error occurred')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const resetAuthForm = () => {
    setAuthMode('options')
    setEmail('')
    setPassword('')
    setName('')
    setAuthError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addComment({ articleSlug, content: content.trim() })
      setContent('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: Id<'comments'>) => {
    try {
      await deleteComment({ commentId })
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  return (
    <section className="border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="size-5" />
        <h2 className="font-serif text-xl font-semibold">Comments</h2>
        {comments && comments.length > 0 && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
            {comments.length}
          </span>
        )}
      </div>

      {/* Auth section */}
      {isSessionLoading ? (
        <div className="mb-6 animate-pulse rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
          <div className="h-10 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      ) : user ? (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="size-8 rounded-full"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <span className="text-sm font-medium">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-32 rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEditName()
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isUpdatingName || !editedName.trim()}
                    className="rounded p-1 text-green-600 hover:bg-neutral-200 disabled:opacity-50 dark:hover:bg-neutral-700 cursor-pointer"
                    title="Save"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    className="rounded p-1 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    title="Cancel"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{user.name || user.email}</span>
                  <button
                    onClick={handleStartEditName}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                    title="Edit name"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <LogOut className="mr-1.5 size-4" />
              Sign out
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full resize-none rounded-lg border border-neutral-200 bg-white p-3 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {isSubmitting ? 'Posting...' : 'Post comment'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-dashed border-neutral-300 p-6 dark:border-neutral-700">
          {authMode === 'options' ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-neutral-500">
                Sign in to join the conversation
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={handleGitHubSignIn}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  <Github className="mr-2 size-4" />
                  Sign in with GitHub
                </Button>
                <Button
                  onClick={() => setAuthMode('email')}
                  variant="outline"
                  className="border-neutral-300 dark:border-neutral-600"
                >
                  <Mail className="mr-2 size-4" />
                  Sign in with Email
                </Button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">
                  {isSignUp ? 'Create an account' : 'Sign in'}
                </h3>
                <button
                  onClick={resetAuthForm}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                >
                  ← Back
                </button>
              </div>
              
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isSignUp && (
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500"
                />
                
                {authError && (
                  <p className="text-sm text-red-500">{authError}</p>
                )}
                
                <Button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {isAuthLoading
                    ? 'Loading...'
                    : isSignUp
                      ? 'Sign up'
                      : 'Sign in'}
                </Button>
              </form>
              
              <p className="mt-4 text-center text-sm text-neutral-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setAuthError('')
                  }}
                  className="font-medium text-neutral-700 hover:underline dark:text-neutral-300 cursor-pointer"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments === undefined ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
                <div className="mb-2 flex items-center gap-2">
                  <div className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="group rounded-lg bg-neutral-50 p-4 transition-colors dark:bg-neutral-900"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {comment.userImage ? (
                    <img
                      src={comment.userImage}
                      alt={comment.userName}
                      className="size-8 rounded-full"
                    />
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <span className="text-sm font-medium">
                        {comment.userName[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{comment.userName}</span>
                    <span className="text-xs text-neutral-400">
                      {formatDistanceToNow(comment.createdAt)}
                    </span>
                  </div>
                </div>
                {user && user.id === comment.userId && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-200 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-neutral-700 cursor-pointer"
                    title="Delete comment"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

