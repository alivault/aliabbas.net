import { useId } from 'react'
import type { ReactNode } from 'react'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'

/** One part of the design record: a numbered title and text, then the content. */
export default function DesignSection({
  children,
  description,
  id,
  number,
  title,
}: {
  children: ReactNode
  description: ReactNode
  id: string
  number: string
  title: string
}) {
  const headingId = useId()
  return (
    <ScrollReveal amount={0.02}>
      <section
        id={id}
        aria-labelledby={headingId}
        className="grid scroll-mt-24 gap-8 lg:scroll-mt-48 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)] lg:gap-x-12"
      >
        <header className="space-y-4 lg:sticky lg:top-48 lg:self-start">
          <Title as="h2" variant="card" id={headingId} className="text-balance">
            <span className="text-fg-muted tabular-nums">{number}</span> {title}
          </Title>
          <div className="text-fg-muted space-y-3 text-base leading-7">
            {description}
          </div>
        </header>
        <div className="min-w-0">{children}</div>
      </section>
    </ScrollReveal>
  )
}

/** A link to a file in the repository, shown as its path. */
export function RepoLink({ path }: { path: string }) {
  return (
    <a
      href={`https://github.com/alivault/aliabbas.net/blob/master/${path}`}
      target="_blank"
      rel="noreferrer"
      className="text-fg-secondary hover:text-brand font-mono text-sm break-all underline decoration-current/30 underline-offset-4 transition-colors"
    >
      {path}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
