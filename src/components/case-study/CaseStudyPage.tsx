import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import SectionNav from '~/components/SectionNav'
import Title from '~/components/Title'
import { caseStudies } from '~/data/case-studies'
import type { CaseStudy } from '~/data/case-studies'
import EvidenceList from './EvidenceList'
import StateMachineSection from './StateMachineSection'

const pillLink =
  'border-foreground/20 hover:border-foreground focus-visible:outline-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

const sectionLinks = [
  { id: 'problem', label: 'Problem and role' },
  { id: 'machines', label: 'State machines' },
  { id: 'failure-modes', label: 'Failure modes' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'sources', label: 'Sources' },
]

function allEvidence(study: CaseStudy) {
  const paths = new Set<string>()
  for (const machine of study.machines)
    for (const path of machine.source) paths.add(path)
  for (const mode of study.failureModes)
    for (const path of mode.evidence) paths.add(path)
  return [...paths].sort()
}

export default function CaseStudyPage({ study }: { study: CaseStudy }) {
  const next =
    caseStudies[
      (caseStudies.findIndex((item) => item.slug === study.slug) + 1) %
        caseStudies.length
    ]

  return (
    <Main>
      <article className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <Link
          to="/work"
          className="text-fg-muted hover:text-brand focus-visible:outline-foreground mb-section-content inline-flex items-center gap-2 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to work
        </Link>

        <ScrollReveal
          as="header"
          trigger="mount"
          className="border-foreground/20 pb-section-divider grid gap-8 border-b lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
        >
          <div>
            <PageHeading>
              {study.title}
              <br />
              as state machines.
            </PageHeading>
          </div>
          <div className="lg:justify-self-end">
            <p className="text-fg-muted max-w-xl text-base leading-7 lg:text-lg lg:leading-8">
              {study.summary}
            </p>
            <dl className="mt-6 grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-base">
              <dt className="text-fg-muted">Product</dt>
              <dd>{study.category}</dd>
              <dt className="text-fg-muted">Year</dt>
              <dd>{study.year}</dd>
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={study.liveHref}
                target="_blank"
                rel="noreferrer"
                className={pillLink}
              >
                Visit {study.liveLabel}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              {study.sourceHref && (
                <a
                  href={study.sourceHref}
                  target="_blank"
                  rel="noreferrer"
                  className={pillLink}
                >
                  Source on GitHub
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>
        </ScrollReveal>

        <SectionNav
          label="On this page"
          items={sectionLinks}
          className="mt-6"
        />

        <ScrollReveal className="mt-section-content grid scroll-mt-24 gap-10 lg:scroll-mt-40 lg:grid-cols-2 lg:gap-16">
          <section
            id="problem"
            aria-labelledby="problem-heading"
            className="scroll-mt-24 lg:scroll-mt-40"
          >
            <Title as="h2" variant="card" id="problem-heading">
              The problem
            </Title>
            <div className="mt-4 space-y-4">
              {study.problem.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-fg-secondary max-w-2xl text-base leading-7 sm:text-lg sm:leading-8"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
          <section aria-labelledby="role-heading">
            <Title as="h2" variant="card" id="role-heading">
              Ali&apos;s role
            </Title>
            <div className="border-foreground/25 mt-4 space-y-4 border-l pl-5">
              {study.role.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-fg-muted max-w-xl text-base leading-7"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <section
          id="machines"
          aria-labelledby="machines-heading"
          className="mt-section scroll-mt-24 lg:scroll-mt-40"
        >
          <ScrollReveal className="pb-section-divider">
            <SectionHeading id="machines-heading">
              The state machines
            </SectionHeading>
            <p className="text-fg-muted mt-4 max-w-2xl text-base leading-7">
              Each diagram comes from the same data as the tables under it. The
              tables give the same facts as text.
            </p>
          </ScrollReveal>
          <div className="space-y-16 sm:space-y-20">
            {study.machines.map((machine, index) => (
              <StateMachineSection
                key={machine.id}
                machine={machine}
                index={index}
                evidenceBaseHref={study.evidenceBaseHref}
              />
            ))}
          </div>
        </section>

        <section
          id="failure-modes"
          aria-labelledby="failure-heading"
          className="mt-section scroll-mt-24 lg:scroll-mt-40"
        >
          <ScrollReveal className="pb-section-divider">
            <SectionHeading id="failure-heading">
              What can go wrong
            </SectionHeading>
          </ScrollReveal>
          <ol className="border-foreground/15 border-t">
            {study.failureModes.map((mode, index) => (
              <ScrollReveal
                as="li"
                key={mode.title}
                className="border-foreground/15 grid gap-6 border-b py-9 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-12"
              >
                <div className="grid min-w-0 grid-cols-[auto_1fr] gap-x-5">
                  <Title
                    as="span"
                    variant="section"
                    aria-hidden="true"
                    className="leading-none tabular-nums"
                  >
                    {index + 1}
                  </Title>
                  <div>
                    <Title as="h3" variant="subsection">
                      {mode.title}
                    </Title>
                    <p className="text-fg-muted mt-3 max-w-md text-base leading-7">
                      {mode.risk}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <Title as="h4" variant="detail">
                    How the design handles it
                  </Title>
                  <ul className="mt-4 space-y-3">
                    {mode.design.map((line) => (
                      <li
                        key={line}
                        className="text-fg-secondary relative max-w-2xl pl-5 text-base leading-7 before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-current before:opacity-40"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                  <EvidenceList
                    paths={mode.evidence}
                    baseHref={study.evidenceBaseHref}
                    className="mt-6"
                  />
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </section>

        <section
          id="numbers"
          aria-labelledby="numbers-heading"
          className="mt-section scroll-mt-24 lg:scroll-mt-40"
        >
          <ScrollReveal className="pb-section-divider">
            <SectionHeading id="numbers-heading">Numbers</SectionHeading>
            <p className="text-fg-muted mt-4 max-w-2xl text-base leading-7">
              Only numbers from the code or from a count. Each one says where it
              comes from.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <dl className="border-foreground/15 bg-foreground/15 grid gap-px overflow-hidden rounded-[2px] border sm:grid-cols-2 lg:grid-cols-4">
              {study.numbers.map((number) => (
                <div
                  key={number.label}
                  className="bg-background flex flex-col gap-3 p-6 sm:p-7"
                >
                  <dt className="text-sm font-bold">{number.label}</dt>
                  <dd className="order-first">
                    <Title as="span" variant="card" className="block">
                      {number.value}
                    </Title>
                  </dd>
                  <dd className="text-fg-muted text-sm leading-6 break-words">
                    {number.method}
                  </dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        </section>

        <section
          id="sources"
          aria-labelledby="sources-heading"
          className="mt-section scroll-mt-24 lg:scroll-mt-40"
        >
          <ScrollReveal>
            <SectionHeading id="sources-heading" size="compact">
              Sources
            </SectionHeading>
            <p className="text-fg-muted mt-3 max-w-2xl text-base leading-7">
              {study.evidenceNote} Every claim on this page comes from these
              files.
            </p>
            <EvidenceList
              paths={allEvidence(study)}
              baseHref={study.evidenceBaseHref}
              className="mt-5"
            />
          </ScrollReveal>
        </section>

        {next && next.slug !== study.slug && (
          <ScrollReveal className="border-foreground/20 mt-section border-t pt-10">
            <Link
              to="/work/$slug"
              params={{ slug: next.slug }}
              className="group hover:text-brand focus-visible:outline-foreground inline-flex items-center gap-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Title as="span" variant="section">
                Next case study: {next.title}
              </Title>
              <ArrowRight
                className="size-8 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </ScrollReveal>
        )}
      </article>
    </Main>
  )
}
