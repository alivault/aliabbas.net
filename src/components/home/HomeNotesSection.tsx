import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
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
                className="group grid gap-4 py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:py-9"
              >
                <span>
                  <Title
                    as="span"
                    variant="card"
                    className="block transition-transform duration-500 group-hover:translate-x-2"
                  >
                    {article.title}
                  </Title>
                  <span className="text-fg-muted mt-2 block text-sm">
                    {getFormattedDate(article.date)}
                  </span>
                </span>
                <ArrowUpRight className="hidden size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:block" />
              </Link>
            </ScrollReveal>
          ))
        )}
      </div>
    </section>
  )
}
