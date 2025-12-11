import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type {SanityArticle} from '~/lib/sanity';
import Main from '~/components/Main'
import Nav from '~/components/Nav'
import PageHeading from '~/components/PageHeading'
import Section from '~/components/Section'
import {  getArticles } from '~/lib/sanity'
import getFormattedDate from '~/lib/getFormattedDate'

export const Route = createFileRoute('/articles')({
  head: () => ({
    meta: [
      { title: 'Articles | Ali Abbas' },
      { name: 'description', content: 'Articles about software development.' },
    ],
  }),
  component: ArticlesPage,
})

function ArticleListItem({ article }: { article: SanityArticle }) {
  return (
    <li>
      <Link
        to="/article/$slug"
        params={{ slug: article.slug.current }}
        className="-mx-4 flex flex-col items-start gap-1 rounded-lg p-4 text-lg transition-colors hover:bg-foreground/10 active:bg-foreground/20"
      >
        {article.title}
        <span className="text-sm opacity-50">
          {getFormattedDate(article.date)}
        </span>
      </Link>
    </li>
  )
}

function ArticlesPage() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  })

  return (
    <Main>
      <Nav />
      <Section>
        <PageHeading>Articles</PageHeading>
        {isLoading ? (
          <p className="prose dark:prose-invert opacity-60">Loading articles...</p>
        ) : articles.length === 0 ? (
          <p className="prose dark:prose-invert">
            No articles yet. Check back soon!
          </p>
        ) : (
          <ul className="flex flex-col">
            {articles.map((article) => (
              <ArticleListItem key={article._id} article={article} />
            ))}
          </ul>
        )}
      </Section>
    </Main>
  )
}
