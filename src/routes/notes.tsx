import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import Section from '~/components/Section'
import Title from '~/components/Title'
import getFormattedDate from '~/lib/getFormattedDate'
import { getArticles } from '~/lib/sanity'
import type { SanityArticle } from '~/lib/sanity'

export const Route = createFileRoute('/notes')({
  head: () => ({
    meta: [
      { title: 'Field Notes — Ali Abbas' },
      {
        name: 'description',
        content:
          'Notes on product engineering, frontend craft, tools, and interaction design.',
      },
    ],
  }),
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
        className="group border-foreground/20 grid gap-4 border-b py-7 sm:grid-cols-[1fr_130px_auto] sm:items-center sm:py-10"
      >
        <span>
          <Title
            as="span"
            variant="card"
            className="block transition-transform duration-500 group-hover:translate-x-2"
          >
            {article.title}
          </Title>
          {article.description && (
            <span className="text-foreground/45 mt-3 block max-w-2xl text-sm leading-6">
              {article.description}
            </span>
          )}
        </span>
        <time
          dateTime={article.date}
          className="text-foreground/40 font-mono text-[9px] uppercase"
        >
          {getFormattedDate(article.date)}
        </time>
        <ArrowUpRight className="hidden size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:block" />
      </Link>
    </ScrollReveal>
  )
}

function NotesPage() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  })

  return (
    <Main>
      <Section>
        <ScrollReveal
          as="header"
          className="border-foreground/20 grid gap-8 border-b pb-12 lg:grid-cols-[1fr_0.65fr] lg:items-end lg:pb-16"
        >
          <div>
            <PageHeading>
              Thinking
              <br />
              <em className="text-brand">in public.</em>
            </PageHeading>
          </div>
          <p className="text-foreground/55 max-w-xl text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
            Notes on software, interaction design, developer tools, and the
            small decisions that make products feel considered.
          </p>
        </ScrollReveal>

        {isLoading ? (
          <div className="divide-foreground/15 divide-y">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="bg-foreground/[0.025] h-36 animate-pulse"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-foreground/45 py-16 text-sm">
            New notes are being written. Check back soon.
          </p>
        ) : (
          <ul>
            {articles.map((article, index) => (
              <NoteListItem key={article._id} article={article} index={index} />
            ))}
          </ul>
        )}
      </Section>
    </Main>
  )
}
