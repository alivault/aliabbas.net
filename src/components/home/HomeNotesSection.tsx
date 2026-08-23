import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import type { SanityArticle } from '~/lib/sanity'
import getFormattedDate from '~/lib/getFormattedDate'

export default function HomeNotesSection({
  articles,
}: {
  articles: Array<SanityArticle>
}) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <ScrollReveal className="border-foreground/20 flex items-end justify-between gap-6 border-b pb-10">
        <div>
          <h2 className="font-display text-[clamp(3rem,6.5vw,6rem)] leading-[0.8] tracking-[-0.055em]">
            Notes
          </h2>
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
          <p className="text-foreground/45 py-12 text-sm">
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
                  <span className="font-display block text-3xl leading-[1.1] tracking-[-0.025em] transition-transform duration-500 group-hover:translate-x-2 sm:text-5xl">
                    {article.title}
                  </span>
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
