import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { SanityArticle } from '~/lib/sanity'
import getFormattedDate from '~/lib/getFormattedDate'

export default function HomeNotesSection({
  articles,
}: {
  articles: Array<SanityArticle>
}) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="flex items-end justify-between gap-6 border-b border-black/20 pb-10">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-black/40 uppercase">
            Field notes
          </p>
          <h2 className="font-display mt-3 text-[clamp(4rem,9vw,8rem)] leading-[0.8] tracking-[-0.055em]">
            Thinking in public.
          </h2>
        </div>
        <Link
          to="/notes"
          className="hidden items-center gap-2 text-xs font-bold sm:flex"
        >
          All notes <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div>
        {articles.length === 0 ? (
          <p className="py-12 text-sm text-black/45">
            New notes are in progress. Check back soon.
          </p>
        ) : (
          articles.map((article, index) => (
            <Link
              key={article._id}
              to="/notes/$slug"
              params={{ slug: article.slug.current }}
              className="group grid gap-4 border-b border-black/20 py-7 sm:grid-cols-[60px_1fr_auto] sm:items-center sm:py-9"
            >
              <span className="font-mono text-[9px] text-black/35">
                0{index + 1}
              </span>
              <span>
                <span className="font-display block text-3xl tracking-[-0.025em] transition-transform duration-500 group-hover:translate-x-2 sm:text-5xl">
                  {article.title}
                </span>
                <span className="mt-2 block text-xs text-black/40">
                  {getFormattedDate(article.date)}
                </span>
              </span>
              <ArrowUpRight className="hidden size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:block" />
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
