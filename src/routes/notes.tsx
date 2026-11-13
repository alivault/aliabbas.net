import { useQuery } from '@tanstack/react-query'
import { pageHead } from '~/lib/structured-data'
import { createFileRoute } from '@tanstack/react-router'
import {
  Line,
  Reader,
  ReaderLink,
  ReaderMeta,
  ReaderSection,
  ReaderText,
  ReaderTitle,
  hudText,
} from '~/components/reader/Reader'
import getFormattedDate from '~/lib/getFormattedDate'
import { articlesQuery } from '~/lib/sanity'

export const Route = createFileRoute('/notes')({
  head: () =>
    pageHead({
      title: 'Field Notes — Ali Abbas',
      description:
        'Notes on product engineering, frontend craft, tools, and interaction design.',
      path: '/notes',
    }),
  // A failed fetch must not break the page: the component fetches again.
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(articlesQuery).catch(() => undefined),
  component: NotesPage,
})

function NotesPage() {
  const { data: articles = [], isLoading } = useQuery(articlesQuery)

  return (
    <Reader>
      <ReaderTitle>Notes</ReaderTitle>
      <ReaderText>
        Notes on software, interaction design, developer tools, and the small
        decisions that make products feel considered.
      </ReaderText>
      {isLoading ? (
        <ReaderMeta>Loading</ReaderMeta>
      ) : articles.length === 0 ? (
        <ReaderMeta>No notes yet</ReaderMeta>
      ) : (
        <ReaderSection title="All notes">
          {articles.map((article) => (
            <Line key={article._id} className="mt-8">
              <p className={hudText}>
                <ReaderLink
                  to="/notes/$slug"
                  params={{ slug: article.slug.current }}
                >
                  {article.title}
                </ReaderLink>
              </p>
              <p className={hudText}>
                <time dateTime={article.date}>
                  ({getFormattedDate(article.date)})
                </time>
              </p>
              {article.description ? (
                <p className="text-fg-secondary mt-2 max-w-[60ch] text-base leading-7">
                  {article.description}
                </p>
              ) : null}
            </Line>
          ))}
        </ReaderSection>
      )}
    </Reader>
  )
}
