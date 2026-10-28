import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import Main from '~/components/Main'
import MonoLabel, { monoLabelStyles } from '~/components/MonoLabel'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import Title from '~/components/Title'
import { caseStudies } from '~/data/case-studies'
import type { CaseStudy } from '~/data/case-studies'
import { cn } from 'cn'
import EvidenceList from './EvidenceList'
import StateMachineSection from './StateMachineSection'

const pillLink =
  'border-foreground/20 hover:border-foreground focus-visible:outline-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

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
          className={cn(
            monoLabelStyles(),
            'hover:text-brand focus-visible:outline-foreground mb-section-content inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4',
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to work
        </Link>

        <ScrollReveal
          as="header"
          trigger="mount"
          className="border-foreground/20 pb-section-divider grid gap-8 border-b lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
        >
          <div>
            <MonoLabel tone="brand">
              Case study · {study.category} · {study.year}
            </MonoLabel>
            <PageHeading className="mt-5">
              {study.title}
              <br />
              <em className="text-brand">as state machines.</em>
            </PageHeading>
          </div>
          <div className="lg:justify-self-end">
            <p className="text-foreground/55 max-w-xl text-base leading-7 lg:text-lg lg:leading-8">
              {study.summary}
            </p>
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

        <nav
          aria-label="On this page"
          className="border-foreground/15 mt-8 flex flex-wrap gap-x-6 gap-y-2"
        >
          {[
            ['#problem', 'Problem and role'],
            ['#machines', 'State machines'],
            ['#failure-modes', 'Failure modes'],
            ['#numbers', 'Numbers'],
            ['#sources', 'Sources'],
          ].map(([href, text]) => (
            <a
              key={href}
              href={href}
              className={cn(
                monoLabelStyles(),
                'hover:text-brand focus-visible:outline-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-4',
              )}
            >
              {text}
            </a>
          ))}
        </nav>

        <ScrollReveal className="mt-section-content grid scroll-mt-24 gap-10 lg:grid-cols-2 lg:gap-16">
          <section id="problem" className="scroll-mt-24">
            <MonoLabel tone="brand">The problem</MonoLabel>
            <div className="mt-4 space-y-4">
              {study.problem.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-foreground/75 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
          <section aria-labelledby="role-label">
            <MonoLabel tone="brand" id="role-label">
              Ali&apos;s role
            </MonoLabel>
            <div className="border-foreground/25 mt-4 space-y-4 border-l pl-5">
              {study.role.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-foreground/60 max-w-xl text-sm leading-6 sm:text-base sm:leading-7"
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
          className="mt-section scroll-mt-24"
        >
          <ScrollReveal className="pb-section-divider">
            <SectionHeading id="machines-heading">
              The state machines
            </SectionHeading>
            <p className="text-foreground/55 mt-4 max-w-2xl text-base leading-7">
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
          className="mt-section scroll-mt-24"
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
                <div className="min-w-0">
                  <MonoLabel tone="brand">
                    Failure {String(index + 1).padStart(2, '0')}
                  </MonoLabel>
                  <Title as="h3" variant="subsection" className="mt-3">
                    {mode.title}
                  </Title>
                  <p className="text-foreground/55 mt-4 max-w-md text-sm leading-6">
                    {mode.risk}
                  </p>
                </div>
                <div className="min-w-0">
                  <MonoLabel>How the design handles it</MonoLabel>
                  <ul className="mt-4 space-y-3">
                    {mode.design.map((line) => (
                      <li
                        key={line}
                        className="text-foreground/75 relative max-w-2xl pl-5 text-base leading-7 before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-current before:opacity-40"
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
          className="mt-section scroll-mt-24"
        >
          <ScrollReveal className="pb-section-divider">
            <SectionHeading id="numbers-heading">Numbers</SectionHeading>
            <p className="text-foreground/55 mt-4 max-w-2xl text-base leading-7">
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
                  <dd className="text-foreground/45 font-mono text-[11px] leading-5 break-words">
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
          className="mt-section scroll-mt-24"
        >
          <ScrollReveal>
            <SectionHeading id="sources-heading" size="compact">
              Sources
            </SectionHeading>
            <p className="text-foreground/55 mt-3 max-w-2xl text-sm leading-6">
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
            <MonoLabel>Next case study</MonoLabel>
            <Link
              to="/work/$slug"
              params={{ slug: next.slug }}
              className="group hover:text-brand focus-visible:outline-foreground mt-3 inline-flex items-center gap-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Title as="span" variant="section">
                {next.title}
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
