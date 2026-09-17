import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import Title from '~/components/Title'
import type { SanityArticle } from '~/lib/sanity'
import getFormattedDate from '~/lib/getFormattedDate'

export default function HomeNotesSection({
  articles,
}: {
  articles: Array<SanityArticle>
}) {
  return (
    <section className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
      <ScrollReveal className="border-foreground/20 pb-section-content flex items-end justify-between gap-6 border-b">
        <div>
          <SectionHeading>Notes</SectionHeading>
        </div>
        <Link
          to="/notes"
          className="group border-foreground/25 hover:text-background relative hidden items-center gap-8 overflow-hidden border-b px-3 py-4 text-xs font-bold uppercase transition-colors duration-300 sm:flex"
        >
          <span className="bg-foreground absolute inset-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
          <span className="relative z-10">View all notes</span>
          <ArrowRight className="relative z-10 size-4" />
        </Link>
      </ScrollReveal>
      <div>
        {articles.length === 0 ? (
          <p className="text-foreground/45 py-section-content text-sm">
            New notes are in progress. Check back soon.
          </p>
        ) : (
          articles.map((article, index) => (
            <ScrollReveal key={article._id} delay={index * 0.06}>
              <Link
                to="/notes/$slug"
                params={{ slug: article.slug.current }}
                className="group border-foreground/20 grid gap-4 border-b py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:py-9"
              >
                <span>
                  <Title
                    as="span"
                    variant="card"
                    className="block transition-transform duration-500 group-hover:translate-x-2"
                  >
                    {article.title}
                  </Title>
                  <span className="text-foreground/40 mt-2 block text-xs">
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
