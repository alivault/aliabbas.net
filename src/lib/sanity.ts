import { createClient } from '@sanity/client'
import { queryOptions } from '@tanstack/react-query'
import type { PortableTextBlock } from '@portabletext/react'

export const sanityClient = createClient({
  projectId: 'a5xqifrz',
  dataset: 'production',
  apiVersion: '2025-12-08',
  useCdn: true,
})

export type SanityArticle = {
  _id: string
  title: string
  slug: { current: string }
  date: string
  description: string
}

export async function getArticles(): Promise<Array<SanityArticle>> {
  return sanityClient.fetch(
    `*[_type == "article"] | order(date desc) {
      _id,
      title,
      slug,
      date,
      description
    }`,
  )
}

export async function getRecentArticles(
  limit = 3,
): Promise<Array<SanityArticle>> {
  return sanityClient.fetch(
    `*[_type == "article"] | order(date desc) [0...$limit] {
      _id,
      title,
      slug,
      date,
      description
    }`,
    { limit },
  )
}

export async function getArticleBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "article" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      date,
      description,
      content
    }`,
    { slug },
  )
}

export type SanityExperience = {
  _id: string
  title: string
  company: string
  url?: string
  startDate: string
  endDate: string | null
  description: string
}

export async function getExperiences(): Promise<Array<SanityExperience>> {
  return sanityClient.fetch(
    `*[_type == "experience"] | order(startDate desc) {
      _id,
      title,
      company,
      url,
      startDate,
      endDate,
      description
    }`,
  )
}

export async function getRecentExperiences(
  limit = 1,
): Promise<Array<SanityExperience>> {
  return sanityClient.fetch(
    `*[_type == "experience"] | order(startDate desc) [0...$limit] {
      _id,
      title,
      company,
      url,
      startDate,
      endDate,
      description
    }`,
    { limit },
  )
}

export type SanityNote = SanityArticle & { content: Array<PortableTextBlock> }

/**
 * Queries shared by route loaders and components. A loader fills the cache
 * on the server, so the HTML has the content and the head has its title.
 */
export const articlesQuery = queryOptions({
  queryKey: ['articles'],
  queryFn: getArticles,
})

export const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug) as Promise<SanityNote | null>,
  })

export const experiencesQuery = queryOptions({
  queryKey: ['experiences'],
  queryFn: getExperiences,
})
