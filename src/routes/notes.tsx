import { useQuery } from '@tanstack/react-query'
import { pageHead } from '~/lib/structured-data'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import Main from '~/components/Main'
import Meta from '~/components/Meta'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import Section from '~/components/Section'
import Title from '~/components/Title'
import getFormattedDate from '~/lib/getFormattedDate'
import { articlesQuery } from '~/lib/sanity'
import type { SanityArticle } from '~/lib/sanity'

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

function NoteListItem({
  article,
  index,
}: {
  article: SanityArticle
  index: number
}) {
  return (
    <ScrollReveal as="li" delay={index * 0.05}>
      <Link
        to="/notes/$slug"
        params={{ slug: article.slug.current }}
        className="group focus-visible:ring-ring/50 focus-visible:ring-offset-background group-has-[a:hover]/notes:text-fg-muted group-has-[a:focus-visible]/notes:text-fg-muted hover:text-foreground! focus-visible:text-foreground! grid gap-4 rounded-sm py-7 transition-colors duration-300 outline-none focus-visible:ring-3 focus-visible:ring-offset-4 sm:grid-cols-[1fr_130px_auto] sm:items-center sm:py-10"
      >
        <span>
          <Title as="span" variant="card" className="block">
            {article.title}
          </Title>
          {article.description && (
            <span className="text-fg-muted mt-3 block max-w-2xl text-sm leading-6">
              {article.description}
            </span>
          )}
        </span>
        <Meta as="time" dateTime={article.date}>
          {getFormattedDate(article.date)}
        </Meta>
        <ArrowRight
          aria-hidden="true"
          className="hidden size-5 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 sm:block"
        />
      </Link>
    </ScrollReveal>
  )
}

function NotesPage() {
  const { data: articles = [], isLoading } = useQuery(articlesQuery)

  return (
    <Main>
      <Section>
        <ScrollReveal
          as="header"
          className="pb-section-content grid justify-items-center gap-6 text-center"
        >
          <div>
            <PageHeading>Thinking in public.</PageHeading>
          </div>
          <p className="text-fg-muted max-w-xl text-base leading-7 text-pretty lg:text-lg lg:leading-8">
            Notes on software, interaction design, developer tools, and the
            small decisions that make products feel considered.
          </p>
        </ScrollReveal>

        {isLoading ? (
          <div className="divide-y">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="bg-foreground/[0.025] h-36 animate-pulse"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-fg-muted py-section-content text-sm">
            New notes are being written. Check back soon.
          </p>
        ) : (
          <ul className="group/notes divide-y">
            {articles.map((article, index) => (
              <NoteListItem key={article._id} article={article} index={index} />
            ))}
          </ul>
        )}
      </Section>
    </Main>
  )
}
