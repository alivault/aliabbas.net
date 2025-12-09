import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import Main from '~/components/Main'
import Nav from '~/components/Nav'
import Section from '~/components/Section'
import { getArticleBySlug, sanityClient } from '~/lib/sanity'
import getFormattedDate from '~/lib/getFormattedDate'
import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react'
import { createImageUrlBuilder } from '@sanity/image-url'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const builder = createImageUrlBuilder(sanityClient)

function CodeBlock({ value }: { value: { code: string; language?: string; filename?: string } }) {
  if (!value.code) return null

  return (
    <div className="my-4">
      {value.filename && (
        <div className="rounded-t-lg bg-[#282c34] px-4 py-2 text-sm text-neutral-400">
          {value.filename}
        </div>
      )}
      <SyntaxHighlighter
        language={value.language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: value.filename ? '0 0 0.5rem 0.5rem' : '0.5rem',
        }}
      >
        {value.code}
      </SyntaxHighlighter>
    </div>
  )
}

const portableTextComponents: PortableTextComponents = {
  types: {
    code: CodeBlock,
    image: ({ value }: { value: { asset: { _ref: string }; alt?: string } }) => {
      const imageUrl = builder.image(value).url()
      return (
        <figure className="my-6">
          <img
            src={imageUrl}
            alt={value.alt || ''}
            className="rounded-lg"
          />
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
  content: PortableTextBlock[]
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
      <article className="prose max-w-none p-5 dark:prose-invert prose-h1:mb-4 prose-h1:text-3xl prose-pre:py-0">
        <h1>{article.title}</h1>
        <time className="text-sm opacity-50" dateTime={article.date}>
          {getFormattedDate(article.date)}
        </time>
        <div className="mt-8">
          <PortableText value={article.content} components={portableTextComponents} />
        </div>
      </article>
    </Main>
  )
}

