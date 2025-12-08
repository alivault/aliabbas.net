import Link from 'next/link'
import Comments from '@/components/Comments'
import Main from '@/components/Main'
import Nav from '@/components/Nav'
import { getArticleByName, getArticlesMeta } from '@/lib/articles'
import getFormattedDate from '@/lib/getFormattedDate'

export const revalidate = 86400 // 24 hours

type Props = {
  params: {
    articleId: string
  }
}

export async function generateStaticParams() {
  const articles = await getArticlesMeta()

  if (!articles) return []

  return articles.map((article) => ({
    articleId: article.id,
  }))
}

export async function generateMetadata({ params: { articleId } }: Props) {
  const article = await getArticleByName(`${articleId}.mdx`)

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  return {
    title: article.meta.title,
    description: article.meta.description,
    openGraph: {
      title: article.meta.title,
      description: article.meta.description,
      url: `https://aliabbas.dev/articles/${articleId}`,
      type: 'article',
    },
    twitter: {
      title: article.meta.title,
      description: article.meta.description,
    },
  }
}

export default async function Article({ params: { articleId } }: Props) {
  const article = await getArticleByName(`${articleId}.mdx`)

  if (!article) {
    return (
      <main className="flex grow flex-col items-center justify-center gap-4">
        <h1>Article not found</h1>
        <Link href="/" className="text-link hover:underline">
          ← Go home
        </Link>
      </main>
    )
  }

  const { meta, content } = article

  const date = getFormattedDate(meta.date)

  return (
    <Main>
      <Nav />
      <article className="prose max-w-none p-5 dark:prose-invert prose-h1:mb-4 prose-h1:text-3xl prose-pre:py-0">
        <h1>{meta.title}</h1>
        <time className="text-sm opacity-50" dateTime={meta.date}>
          {date}
        </time>
        {content}
      </article>
      <Comments />
    </Main>
  )
}
