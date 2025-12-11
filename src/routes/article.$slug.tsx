import {
  PortableText
  
  
} from '@portabletext/react'
import { createImageUrlBuilder } from '@sanity/image-url'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import type {PortableTextBlock, PortableTextComponents} from '@portabletext/react';
import { CodeBlock } from '~/components/CodeBlock'
import { Comments } from '~/components/Comments'
import Main from '~/components/Main'
import Nav from '~/components/Nav'
import Section from '~/components/Section'
import getFormattedDate from '~/lib/getFormattedDate'
import { getArticleBySlug, sanityClient } from '~/lib/sanity'

const builder = createImageUrlBuilder(sanityClient)

const portableTextComponents: PortableTextComponents = {
  types: {
    code: CodeBlock,
    image: ({
      value,
    }: {
      value: { asset: { _ref: string }; alt?: string }
    }) => {
      const imageUrl = builder.image(value).url()
      return (
        <figure className="my-6">
          <img src={imageUrl} alt={value.alt || ''} className="rounded-lg" />
          {value.alt && (
            <figcaption className="mt-2 text-center text-sm opacity-60">
              {value.alt}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  marks: {
    code: ({ children }) => (
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm dark:bg-neutral-800">
        {children}
      </code>
    ),
  },
}

export const Route = createFileRoute('/article/$slug')({
  component: ArticlePage,
})

type ArticleData = {
  _id: string
  title: string
  slug: { current: string }
  date: string
  description: string
  content: Array<PortableTextBlock>
}

function ArticlePage() {
  const { slug } = Route.useParams()
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug) as Promise<ArticleData | null>,
  })

  if (isLoading) {
    return (
      <Main>
        <Nav />
        <Section>
          <p className="opacity-60">Loading article...</p>
        </Section>
      </Main>
    )
  }

  if (!article) {
    return (
      <Main>
        <Nav />
        <Section>
          <div className="flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Article not found</h1>
            <Link to="/articles" className="text-blue-500 hover:underline">
              ← Back to articles
            </Link>
          </div>
        </Section>
      </Main>
    )
  }

  return (
    <Main>
      <Nav />
      <article className="prose dark:prose-invert prose-h1:mb-4 prose-h1:text-3xl prose-pre:py-0 max-w-none p-5">
        <h1>{article.title}</h1>
        <time className="text-sm opacity-50" dateTime={article.date}>
          {getFormattedDate(article.date)}
        </time>
        <PortableText
          value={article.content}
          components={portableTextComponents}
        />
      </article>
      <div className="p-5">
        <Comments articleSlug={slug} />
      </div>
    </Main>
  )
}
