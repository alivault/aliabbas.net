import { v } from 'convex/values'
import { Resend } from 'resend'
import { internalAction, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
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

    const userName = user.name || user.email || 'Anonymous'

    const commentId = await ctx.db.insert('comments', {
      articleSlug: args.articleSlug,
      content: args.content,
      userId: user._id,
      userName,
      userImage: user.image || undefined,
      createdAt: Date.now(),
    })

    // Send email notification to admin
    await ctx.scheduler.runAfter(0, internal.comments.sendCommentNotification, {
      articleSlug: args.articleSlug,
      userName,
      userEmail: user.email,
      content: args.content,
    })

    return commentId
  },
})

// Internal action to send comment notification email
export const sendCommentNotification = internalAction({
  args: {
    articleSlug: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    content: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const siteUrl = process.env.SITE_URL || 'https://aliabbas.net'
    const noteUrl = `${siteUrl}/notes/${args.articleSlug}`

    await resend.emails.send({
      from: 'Ali Abbas <noreply@mail.aliabbas.net>',
      to: 'ali@aliabbas.net',
      subject: `New comment from ${args.userName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="margin-bottom: 24px; color: #171717;">
            New comment on your note
          </h2>
          <p style="color: #525252; margin-bottom: 8px;">
            <strong>${args.userName}</strong> (${args.userEmail}) commented:
          </p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #171717; margin: 0; white-space: pre-wrap;">${args.content}</p>
          </div>
          <a href="${noteUrl}" style="display: inline-block; background: #171717; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Note
          </a>
        </div>
      `,
    })
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
