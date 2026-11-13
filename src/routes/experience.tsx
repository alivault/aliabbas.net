import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'
import {
  Reader,
  ReaderExternal,
  ReaderLinks,
  ReaderList,
  ReaderMeta,
  ReaderSection,
  ReaderText,
  ReaderTitle,
} from '~/components/reader/Reader'
import { experiencesQuery } from '~/lib/sanity'
import type { SanityExperience } from '~/lib/sanity'

export const Route = createFileRoute('/experience')({
  head: () =>
    pageHead({
      title: 'Experience — Ali Abbas',
      description:
        'The experience of Ali Abbas in senior frontend engineering and design, on interactive, streaming and real-time products.',
      path: '/experience',
    }),
  loader: ({ context }) =>
    context.queryClient
      .ensureQueryData(experiencesQuery)
      .catch(() => undefined),
  component: ExperiencePage,
})

function years(experience: SanityExperience) {
  const start = experience.startDate.slice(0, 4)
  const end = experience.endDate ? experience.endDate.slice(0, 4) : 'Now'
  return start === end ? start : `${start}–${end}`
}

function ExperiencePage() {
  const { data: experiences = [], isLoading } = useQuery(experiencesQuery)

  return (
    <Reader>
      <ReaderTitle>Experience</ReaderTitle>
      <ReaderText>
        I worked in brand and product design for more than 15 years, then in
        frontend engineering for 5 years. Each role taught me how to ship better
        work.
      </ReaderText>
      {isLoading ? (
        <ReaderMeta>Loading</ReaderMeta>
      ) : experiences.length === 0 ? (
        <ReaderMeta>No experience yet</ReaderMeta>
      ) : (
        experiences.map((experience) => (
          <ReaderSection
            key={experience._id}
            title={`${experience.company} (${years(experience)})`}
          >
            <ReaderList items={[experience.title]} className="mt-2" />
            <ReaderText>{experience.description}</ReaderText>
            {experience.url ? (
              <ReaderLinks>
                <ReaderExternal href={experience.url}>Visit</ReaderExternal>
              </ReaderLinks>
            ) : null}
          </ReaderSection>
        ))
      )}
    </Reader>
  )
}
