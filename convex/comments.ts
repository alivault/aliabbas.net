import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { authComponent } from './auth'

// Get all comments for an article
export const getComments = query({
  args: { articleSlug: v.string() },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_article', (q) => q.eq('articleSlug', args.articleSlug))
      .order('desc')
      .collect()
    return comments
  },
})

// Add a new comment (requires authentication and verified email)
export const addComment = mutation({
  args: {
    articleSlug: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      throw new Error('You must be logged in to comment')
    }

    if (!user.emailVerified) {
      throw new Error('Please verify your email address before commenting')
    }

    const commentId = await ctx.db.insert('comments', {
      articleSlug: args.articleSlug,
      content: args.content,
      userId: user._id,
      userName: user.name || user.email || 'Anonymous',
      userImage: user.image || undefined,
      createdAt: Date.now(),
    })

    return commentId
  },
})

// Delete a comment (only by the author)
export const deleteComment = mutation({
  args: { commentId: v.id('comments') },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      throw new Error('You must be logged in')
    }

    const comment = await ctx.db.get(args.commentId)
    if (!comment) {
      throw new Error('Comment not found')
    }

    if (comment.userId !== user._id) {
      throw new Error('You can only delete your own comments')
    }

    await ctx.db.delete(args.commentId)
  },
})

// Update user name on all their comments
export const updateUserName = mutation({
  args: { newName: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      throw new Error('You must be logged in')
    }

    const userComments = await ctx.db
      .query('comments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    for (const comment of userComments) {
      await ctx.db.patch(comment._id, { userName: args.newName })
    }

    return userComments.length
  },
})

