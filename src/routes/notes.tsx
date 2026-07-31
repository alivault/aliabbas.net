import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Main from '~/components/Main'
import ScrollReveal from '~/components/ScrollReveal'
import Section from '~/components/Section'
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
        className="group grid gap-4 border-b border-black/20 py-7 sm:grid-cols-[56px_1fr_130px_auto] sm:items-center sm:py-10"
      >
        <span className="font-mono text-[9px] text-black/35">0{index + 1}</span>
        <span>
          <span className="font-display block text-3xl leading-[1.1] tracking-[-0.03em] transition-transform duration-500 group-hover:translate-x-2 sm:text-5xl">
            {article.title}
          </span>
          {article.description && (
            <span className="mt-3 block max-w-2xl text-sm leading-6 text-black/45">
              {article.description}
            </span>
          )}
        </span>
        <time
          dateTime={article.date}
          className="font-mono text-[9px] tracking-[0.12em] text-black/40 uppercase"
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
          className="grid gap-8 border-b border-black/20 pb-12 lg:grid-cols-[1fr_0.65fr] lg:items-end lg:pb-16"
        >
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#335cff] uppercase">
              Notes on making digital things
            </p>
            <h1 className="font-display mt-5 text-[clamp(3.5rem,10vw,9rem)] leading-[0.74] tracking-[-0.065em]">
              Thinking
              <br />
              <em className="text-[#335cff]">in public.</em>
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-black/55 lg:justify-self-end lg:text-lg lg:leading-8">
            Notes on software, interaction design, developer tools, and the
            small decisions that make products feel considered.
          </p>
        </ScrollReveal>

        {isLoading ? (
          <div className="divide-y divide-black/15">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 animate-pulse bg-black/[0.025]" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="py-16 text-sm text-black/45">
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
