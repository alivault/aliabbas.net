import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import Title from '~/components/Title'
import { ButtonLink } from '~/components/ui/button'
import type { SanityArticle } from '~/lib/sanity'
import getFormattedDate from '~/lib/getFormattedDate'

export default function HomeNotesSection({
  articles,
}: {
  articles: Array<SanityArticle>
}) {
  return (
    <section className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
      <ScrollReveal className="pb-section-content flex items-end justify-between gap-6">
        <div>
          <SectionHeading>Notes</SectionHeading>
        </div>
        <ButtonLink
          to="/notes"
          variant="secondary"
          className="hidden sm:inline-flex"
        >
          View all notes
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      </ScrollReveal>
      <div className="divide-y">
        {articles.length === 0 ? (
          <p className="text-fg-muted py-section-content text-sm">
            New notes are in progress. Check back soon.
          </p>
        ) : (
          articles.map((article, index) => (
            <ScrollReveal key={article._id} delay={index * 0.06}>
              <Link
                to="/notes/$slug"
                params={{ slug: article.slug.current }}
                className="group focus-visible:ring-ring/50 focus-visible:ring-offset-background hover:text-brand focus-visible:text-brand grid gap-4 rounded-sm py-7 transition-colors duration-300 outline-none focus-visible:ring-3 focus-visible:ring-offset-4 sm:grid-cols-[1fr_auto] sm:items-center sm:py-9"
              >
                <span>
                  <Title as="span" variant="card" className="block">
                    {article.title}
                  </Title>
                  <span className="text-fg-muted mt-2 block text-sm">
                    {getFormattedDate(article.date)}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="hidden size-5 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 sm:block"
                />
              </Link>
            </ScrollReveal>
          ))
        )}
      </div>
    </section>
  )
}
