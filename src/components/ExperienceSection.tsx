import { useQuery } from '@tanstack/react-query'
import ExperienceList from './ExperienceList'
import Section from './Section'
import SectionHeading from './SectionHeading'
import SectionButton from './SectionButton'
import { getRecentExperiences } from '~/lib/sanity'

export default function ExperienceSection() {
  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['recentExperiences'],
    queryFn: () => getRecentExperiences(1),
  })

  return (
    <Section>
      <SectionHeading>Experience</SectionHeading>
      {isLoading ? (
        <p className="prose dark:prose-invert opacity-60">Loading experience...</p>
      ) : experiences.length === 0 ? (
        <p className="prose dark:prose-invert">No experience yet.</p>
      ) : (
        <ExperienceList experiences={experiences} />
      )}
      <SectionButton href="/experience">View All Experience</SectionButton>
    </Section>
  )
}
