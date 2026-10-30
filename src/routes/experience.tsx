import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import ExperienceList from '~/components/ExperienceList'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import Section from '~/components/Section'
import { experiencesQuery } from '~/lib/sanity'

export const Route = createFileRoute('/experience')({
  head: () => ({
    meta: [
      { title: 'Experience — Ali Abbas' },
      {
        name: 'description',
        content:
          'Senior frontend engineering and design experience across interactive, streaming and realtime products.',
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient
      .ensureQueryData(experiencesQuery)
      .catch(() => undefined),
  component: ExperiencePage,
})

function ExperiencePage() {
  const { data: experiences = [], isLoading } = useQuery(experiencesQuery)

  return (
    <Main>
      <Section>
        <ScrollReveal
          as="header"
          className="border-foreground/20 pb-section-content grid gap-8 border-b lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
        >
          <div>
            <PageHeading>
              Work that
              <br />
              shaped me.
            </PageHeading>
          </div>
          <p className="text-fg-muted max-w-xl text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
            A path through product teams, creative development, frontend
            systems, and the problems that taught me how to ship better work.
          </p>
        </ScrollReveal>

        {isLoading ? (
          <div className="divide-foreground/15 divide-y">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="bg-foreground/[0.025] h-52 animate-pulse"
              />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <p className="text-fg-muted py-section-content text-sm">
            No experience yet.
          </p>
        ) : (
          <ExperienceList experiences={experiences} />
        )}
      </Section>
    </Main>
  )
}
