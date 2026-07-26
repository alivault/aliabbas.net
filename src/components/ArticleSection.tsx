import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import Section from './Section'
import SectionHeading from './SectionHeading'
import SectionButton from './SectionButton'
import type { SanityArticle } from '~/lib/sanity'
import getFormattedDate from '~/lib/getFormattedDate'
import { getRecentArticles } from '~/lib/sanity'

function ArticleListItem({ article }: { article: SanityArticle }) {
  return (
    <li>
      <Link
        to="/notes/$slug"
        params={{ slug: article.slug.current }}
        className="hover:bg-foreground/10 active:bg-foreground/20 -mx-4 flex flex-col items-start gap-1 rounded-lg p-4 text-lg transition-colors"
      >
        {article.title}
        <span className="text-sm opacity-50">
          {getFormattedDate(article.date)}
        </span>
      </Link>
    </li>
  )
}

export default function ArticlesSection() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['recentArticles'],
    queryFn: () => getRecentArticles(3),
  })

  return (
    <Section>
      <SectionHeading>Notes</SectionHeading>
      {isLoading ? (
        <p className="prose dark:prose-invert opacity-60">Loading notes...</p>
      ) : articles.length === 0 ? (
        <p className="prose dark:prose-invert">
          No notes yet. Check back soon!
        </p>
      ) : (
        <ul className="flex flex-col">
          {articles.map((article) => (
            <ArticleListItem key={article._id} article={article} />
          ))}
        </ul>
      )}
      <SectionButton href="/notes">View All Notes</SectionButton>
    </Section>
  )
}
