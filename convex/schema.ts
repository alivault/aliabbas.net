import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  comments: defineTable({
    articleSlug: v.string(),
    content: v.string(),
    userId: v.string(),
    userName: v.string(),
    userImage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_article', ['articleSlug'])
    .index('by_user', ['userId']),
})
